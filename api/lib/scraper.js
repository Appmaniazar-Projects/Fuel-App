/**
 * lib/scraper.js
 * Scrapes official SA fuel prices from FIASA (Fuels Industry Association of
 * South Africa).
 *
 * IMPORTANT — matches the REAL page structure (verified 2026-07-10):
 *   - The page has two separate current-year tables: Coastal and Gauteng.
 *     They're distinguished by content, not position: only the Gauteng
 *     table has 93-octane rows.
 *   - Each row has 12 month columns (Jan–Dec); columns for months that
 *     haven't happened yet are blank. We take the RIGHTMOST filled cell
 *     per row as the current price, and the cell immediately before it
 *     as the previous price (for the "change" indicator).
 *   - Values use a COMMA as the decimal separator (e.g. "1992,00" = R19.92,
 *     i.e. 1992 cents). This must be converted before parseFloat, or you
 *     get nonsense values like "1992,00" -> "199200".
 *   - There is no separate "paraffin retail" figure on this page — only
 *     one "Illuminating Paraffin" row, which the page's own footnote
 *     labels as a WHOLESALE price. We report it as paraffin_wholesale
 *     only; paraffin_retail is never scraped and always comes from the
 *     fallback data.
 *
 * DMRE is not scraped: their announcements describe price *changes*, not
 * absolute prices, so there's no honest way to derive a current price from
 * them without a separately maintained running base price.
 */

const axios = require("axios");
const cheerio = require("cheerio");

const FIASA_URL =
  "https://fuelsindustry.org.za/consumer-information/fuel-prices-current-past/";

const SCRAPER_CONFIG = {
  timeout: 10000,
  userAgent: "Mozilla/5.0 (compatible; FillUpBot/3.0; +https://fillup.co.za)",
};

// Petrol/diesel/paraffin are priced in cents PER LITRE.
const PLAUSIBLE_LITRE_RANGE = { min: 1000, max: 3500 }; // R10.00 – R35.00 /L
// LPG is priced in cents PER KG and has historically run higher.
const PLAUSIBLE_LPG_RANGE = { min: 1500, max: 6000 }; // R15.00 – R60.00 /kg

function isPlausible(cents, key) {
  const range = key === "lpg" ? PLAUSIBLE_LPG_RANGE : PLAUSIBLE_LITRE_RANGE;
  return typeof cents === "number" && !isNaN(cents) && cents >= range.min && cents <= range.max;
}

// ── Fuel metadata, split by region since Coastal and Gauteng report
// different grades (Coastal has no 93-octane; Gauteng doesn't distinguish
// leaded 95 from unleaded 95 as a separate line the way Coastal does). ──
const REGION_FUELS = {
  coastal: {
    unleaded_95: { label: "Unleaded 95", grade: "ULP", type: "Petrol", match: ["95", "ulp"] },
    leaded_95: { label: "Leaded 95", grade: "LRP", type: "Petrol", match: ["95", "lrp"] },
    diesel_50ppm: { label: "Diesel 50ppm", grade: "0.05%", type: "Diesel", match: ["diesel", "0.05"] },
    diesel_500ppm: { label: "Diesel 500ppm", grade: "0.005%", type: "Diesel", match: ["diesel", "0.005"] },
    paraffin_wholesale: { label: "Paraffin Wholesale", grade: "Wholesale", type: "Paraffin", match: ["paraffin"] },
    lpg: { label: "LPG", grade: "per kg", type: "LPG", match: ["gas"] },
  },
  gauteng: {
    unleaded_93: { label: "Unleaded 93", grade: "ULP", type: "Petrol", match: ["93", "ulp"] },
    leaded_93: { label: "Leaded 93", grade: "LRP", type: "Petrol", match: ["93", "lrp"] },
    unleaded_95: { label: "Unleaded 95", grade: "ULP", type: "Petrol", match: ["95", "ulp"] },
    diesel_50ppm: { label: "Diesel 50ppm", grade: "0.05%", type: "Diesel", match: ["diesel", "0.05"] },
    diesel_500ppm: { label: "Diesel 500ppm", grade: "0.005%", type: "Diesel", match: ["diesel", "0.005"] },
    paraffin_wholesale: { label: "Paraffin Wholesale", grade: "Wholesale", type: "Paraffin", match: ["paraffin"] },
    lpg: { label: "LPG", grade: "per kg", type: "LPG", match: ["gas"] },
  },
};

// ── Fallback data — taken directly from the live FIASA table for the
// 1-Jul-26 column (the latest published figures as of this writing).
// Update this monthly alongside FIASA's own publication schedule (first
// week of each month) if live scraping is failing.
const FALLBACK = {
  coastal: {
    effective_date: "2026-07-01",
    next_revision: "2026-08-05",
    prices: {
      unleaded_95: 2523,
      leaded_95: 2523,
      diesel_50ppm: 2392,
      diesel_500ppm: 2430,
      paraffin_wholesale: 1619,
      paraffin_retail: 1587, // no live source for this — carried from prior manual gazette figure
      lpg: 3786,
    },
    prev: {
      unleaded_95: 2719,
      leaded_95: 2719,
      diesel_50ppm: 2705,
      diesel_500ppm: 2789,
      paraffin_wholesale: 2142,
      paraffin_retail: 1529,
      lpg: 3769,
    },
  },
  gauteng: {
    effective_date: "2026-07-01",
    next_revision: "2026-08-05",
    prices: {
      unleaded_93: 2594,
      leaded_93: 2594,
      unleaded_95: 2610,
      diesel_50ppm: 2479,
      diesel_500ppm: 2517,
      paraffin_wholesale: 1724,
      paraffin_retail: 1643, // no live source for this — carried from prior manual gazette figure
      lpg: 4111,
    },
    prev: {
      unleaded_93: 2795,
      leaded_93: 2795,
      unleaded_95: 2663,
      diesel_50ppm: 2793,
      diesel_500ppm: 2876,
      paraffin_wholesale: 2247,
      paraffin_retail: 1599,
      lpg: 4095,
    },
  },
};

function fallbackPrices(region = "gauteng") {
  const r = region === "coastal" ? "coastal" : "gauteng";
  return { ...FALLBACK[r].prices };
}

// ── Value parsing ────────────────────────────────────────────────────────
// FIASA uses a comma as the decimal separator (e.g. "1992,00" = 1992.00
// cents). Must convert before parseFloat or digits get concatenated into
// nonsense (this was the root cause of earlier implausible-value bugs).
function parseFiasaCell(text) {
  const cleaned = (text || "").trim().replace(/\s+/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.replace(",", ".");
  const value = parseFloat(normalized);
  if (isNaN(value)) return null;
  return value; // already cents, per the page's own header
}

// ── Table parsing ────────────────────────────────────────────────────────
// Finds current-year tables (header row's first cell reads "Products"),
// classifies each as coastal/gauteng by whether it has a 93-octane row,
// and for each fuel row picks the rightmost filled month column as the
// current price and the column before it as the previous price.
function parseFiasaTables(html) {
  const $ = cheerio.load(html);
  const results = {};

  $("table").each((_, table) => {
    const $table = $(table);
    const rows = $table.find("tr");
    if (rows.length < 2) return;

    const headerCells = $(rows[0]).find("th, td");
    const firstHeader = $(headerCells[0]).text().trim().toLowerCase();
    if (firstHeader !== "products") return; // not a current-year price table

    // Collect the raw label of each data row first, to classify the table.
    const dataRows = [];
    for (let i = 1; i < rows.length; i++) {
      const cells = $(rows[i]).find("td, th");
      if (cells.length < 2) continue;
      const label = $(cells[0]).text().trim().toLowerCase();
      dataRows.push({ label, cells });
    }

    const region = dataRows.some((r) => r.label.includes("93")) ? "gauteng" : "coastal";
    const fuelDefs = REGION_FUELS[region];

    const prices = {};
    let latestDateLabel = null;

    for (const { label, cells } of dataRows) {
      // Find which fuel key (if any) this row corresponds to.
      const entry = Object.entries(fuelDefs).find(([, meta]) =>
        meta.match.every((p) => label.includes(p))
      );
      if (!entry) continue;
      const [key] = entry;

      // Walk month columns right-to-left; first non-empty cell is current.
      let currentVal = null;
      let currentIdx = -1;
      for (let c = cells.length - 1; c >= 1; c--) {
        const val = parseFiasaCell($(cells[c]).text());
        if (val !== null) {
          currentVal = val;
          currentIdx = c;
          break;
        }
      }
      if (currentVal === null) continue;

      const cents = Math.round(currentVal);
      if (!isPlausible(cents, key)) {
        console.warn(`⚠️ Rejected implausible ${region}.${key}: ${cents}c (raw "${currentVal}")`);
        continue;
      }
      prices[key] = cents;

      // Track which header column this came from, to report an effective date.
      if (currentIdx >= 0) {
        const headerLabel = $(headerCells[currentIdx]).text().trim();
        if (headerLabel) latestDateLabel = headerLabel;
      }
    }

    if (Object.keys(prices).length > 0) {
      results[region] = { prices, dateLabel: latestDateLabel };
    }
  });

  return results;
}

async function scrapeFIASA() {
  const { data: html } = await axios.get(FIASA_URL, {
    timeout: SCRAPER_CONFIG.timeout,
    headers: { "User-Agent": SCRAPER_CONFIG.userAgent },
  });

  const parsed = parseFiasaTables(html);
  if (!parsed.coastal && !parsed.gauteng) {
    throw new Error("FIASA scrape found no recognizable price tables");
  }
  return parsed;
}

// ── Build the response fuel array for a given region ───────────────────
function buildFuelArray(region, rawPrices) {
  const fuelDefs = REGION_FUELS[region === "coastal" ? "coastal" : "gauteng"];
  const fallback = fallbackPrices(region);
  const prevFallback = FALLBACK[region === "coastal" ? "coastal" : "gauteng"].prev;

  return Object.entries(fuelDefs).map(([key, meta]) => {
    const price = rawPrices[key] ?? fallback[key];
    const prev = prevFallback[key] ?? price;
    const change = price - prev;
    return {
      key,
      label: meta.label,
      type: meta.type,
      grade: meta.grade,
      price,
      price_rands: +(price / 100).toFixed(2),
      prev,
      change,
      direction: change > 0 ? "increase" : change < 0 ? "decrease" : "unchanged",
    };
  });
}

// ── Main export ──────────────────────────────────────────────────────────
// region: 'coastal' | 'inland' | 'gauteng' (inland is treated as gauteng)
async function getLatestPrices(region = "inland") {
  const normalizedRegion = region === "coastal" ? "coastal" : "gauteng";
  // Two names for the same region are used deliberately:
  // - regionLabel: human-facing display text, e.g. in API JSON responses.
  // - regionKey: the canonical value stored in Supabase's fuel_prices.region
  //   column and matched against by the FuelWise app's direct-Supabase
  //   fallback query (`.eq('region', selectedRegion)`). These must stay in
  //   sync with the region key strings the app uses ('Gauteng Inland',
  //   'Western Cape Coastal') — they are NOT the same string as regionLabel.
  const regionLabel = normalizedRegion === "coastal" ? "Western Cape (Coastal)" : "Gauteng (Inland)";
  const regionKey = normalizedRegion === "coastal" ? "Western Cape Coastal" : "Gauteng Inland";

  let rawPrices;
  let source;
  let effectiveDate = FALLBACK[normalizedRegion].effective_date;
  let nextRevision = FALLBACK[normalizedRegion].next_revision;

  try {
    const scraped = await scrapeFIASA();
    const regionData = scraped[normalizedRegion];
    if (!regionData || Object.keys(regionData.prices).length < 4) {
      throw new Error(`FIASA scrape returned insufficient data for ${normalizedRegion}`);
    }
    rawPrices = regionData.prices;
    source = "fuelsindustry.org.za";
    console.log(`✅ FIASA scrape successful for ${normalizedRegion}: ${Object.keys(rawPrices).length} prices`);
  } catch (err) {
    console.warn(`FIASA scrape failed for ${normalizedRegion}, using fallback:`, err.message);
    rawPrices = fallbackPrices(normalizedRegion);
    source = "gazette_fallback";
  }

  return {
    effective_date: effectiveDate,
    next_revision: nextRevision,
    region: regionLabel,
    region_key: regionKey,
    currency: "ZAR",
    unit: "cents_per_litre",
    fuels: buildFuelArray(normalizedRegion, rawPrices),
    macro: {
      brent_crude_usd: 69.08,
      zar_usd_rate: 16.26,
    },
    _meta: {
      data_source: source,
      fetched_at: new Date().toISOString(),
    },
  };
}

// ── Health check ────────────────────────────────────────────────────────
async function scraperHealthCheck() {
  const health = { status: "healthy", sources: {}, timestamp: new Date().toISOString() };
  try {
    const response = await axios.get("https://fuelsindustry.org.za/", {
      timeout: 5000,
      headers: { "User-Agent": SCRAPER_CONFIG.userAgent },
    });
    health.sources.FIASA = { status: "available", statusCode: response.status };
  } catch (err) {
    health.sources.FIASA = { status: "unavailable", error: err.code || err.message };
    health.status = "degraded";
  }
  return health;
}

// ── Flat fuel metadata ──────────────────────────────────────────────────
// A single fuel can appear in both regions (e.g. unleaded_95), so this
// merges both region definitions into one lookup keyed by fuel_key. Used
// by /api/fuel/keys (list all known fuel types) and /api/fuel/history
// (validate a requested fuel_key before querying the database).
const FUEL_META = { ...REGION_FUELS.gauteng, ...REGION_FUELS.coastal };

// ── Monthly snapshot for persistence ────────────────────────────────────
// Returns data shaped for FuelPriceDB.upsertCurrentPrices/addHistoricalData
// rather than the API-response shape getLatestPrices returns. Calls the
// same scrape-with-fallback path as getLatestPrices — never invents a
// number that path wouldn't otherwise produce.
async function fetchMonthlyPrices(region = "gauteng") {
  const data = await getLatestPrices(region);
  return {
    effective_date: data.effective_date,
    region: data.region_key, // DB-canonical, e.g. "Gauteng Inland" — matches fuel_prices.region
    region_label: data.region, // human-facing, e.g. "Gauteng (Inland)"
    source: data._meta.data_source,
    fetched_at: data._meta.fetched_at,
    prices: Object.fromEntries(data.fuels.map((f) => [f.key, f.price])),
  };
}

module.exports = {
  getLatestPrices,
  scraperHealthCheck,
  fallbackPrices,
  fetchMonthlyPrices,
  REGION_FUELS,
  FUEL_META,
  isPlausible,
};