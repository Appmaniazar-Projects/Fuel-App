/**
 * GET or POST /api/fuel/update-monthly
 *
 * Triggered monthly (see vercel.json's "crons" entry) to fetch the latest
 * official prices and persist them: sets a new current row in fuel_prices
 * for each region, and appends a row per fuel to fuel_history so trend
 * data keeps growing. Only ever writes what fetchMonthlyPrices genuinely
 * scraped (or the dated fallback figures in lib/scraper.js if the live
 * scrape failed that run) — never a placeholder invented at write time.
 *
 * NOTE: Vercel Cron Jobs always trigger via GET, so this uses withAuth
 * (which allows GET and POST). Set CRON_SECRET in the Vercel project's
 * environment variables; Vercel then sends it as a Bearer token on every
 * cron call and lib/auth.js accepts it.
 *
 * Safe to run more than once a month: the current row is replaced, and the
 * month's history rows are overwritten rather than duplicated.
 */

const { withAuth } = require("../../lib/auth");
const { fetchMonthlyPrices } = require("../../lib/scraper");
const { FuelPriceDB } = require("../../lib/supabase");
const { ok, error } = require("../../lib/respond");

const REGIONS = ["gauteng", "coastal"];
// fuel_history has no region column and the seeded history is Gauteng
// Inland, so only that region's prices go into history.
const HISTORY_REGION = "Gauteng Inland";

module.exports = withAuth(async (req, res) => {
  const results = [];

  try {
    for (const region of REGIONS) {
      const snapshot = await fetchMonthlyPrices(region);

      // Never persist the hardcoded fallback figures: if the live scrape
      // failed, keep whatever real data is already stored and report it.
      if (snapshot.source === "gazette_fallback") {
        results.push({ region: snapshot.region, skipped: true, reason: "live scrape failed" });
        continue;
      }

      const saved = await FuelPriceDB.upsertCurrentPrices(
        snapshot.region,
        snapshot.prices,
        snapshot.source,
        snapshot.effective_date
      );

      let historySaved = [];
      if (snapshot.region === HISTORY_REGION) {
        const month = `${snapshot.effective_date.slice(0, 7)}-01`;
        const historyRows = Object.entries(snapshot.prices)
          .filter(([fuel_key]) => fuel_key !== "paraffin_wholesale" && fuel_key !== "lpg")
          .map(([fuel_key, price_cents]) => ({ month, fuel_key, price_cents }));
        historySaved = await FuelPriceDB.replaceHistoryForMonth(month, historyRows);
      }

      results.push({
        region: snapshot.region,
        source: snapshot.source,
        current_row_id: saved.id,
        history_rows_added: historySaved.length,
      });
    }

    const allSkipped = results.every((r) => r.skipped);
    if (allSkipped) {
      return error(res, 502, "Live scrape failed for every region; nothing was saved.");
    }
    return ok(res, { success: true, results });
  } catch (err) {
    console.error("[/api/fuel/update-monthly]", err.message);
    return error(res, 500, err.message || "Failed to update monthly prices");
  }
});
