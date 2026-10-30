/**
 * lib/stations.js
 * Imports South Africa's fuel stations from OpenStreetMap (Overpass API)
 * into the fuel_stations table. Brand rules match mobile/lib/stations.ts.
 */

const axios = require("axios");
const { supabase } = require("./supabase");

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

// South Africa split into a 4 x 4 grid of bounding boxes [south, west, north, east].
// Small queries finish quickly and one failing area doesn't sink the rest.
function saTiles() {
  const S = -35.0, N = -22.0, W = 16.3, E = 33.0;
  const rows = 4, cols = 4, tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const s = S + ((N - S) * r) / rows, n = S + ((N - S) * (r + 1)) / rows;
      const w = W + ((E - W) * c) / cols, e = W + ((E - W) * (c + 1)) / cols;
      tiles.push([s, w, n, e].map((v) => +v.toFixed(3)));
    }
  }
  return tiles;
}

// Node's network errors (e.g. AggregateError from a refused connection) can
// have an empty message, so fall back to the error code.
function describe(err) {
  if (!err) return "unknown error";
  if (err.response) return `HTTP ${err.response.status}`;
  return err.message || err.code || (err.errors && err.errors.map((e) => e.code || e.message).join(", ")) || String(err);
}

const BRAND_LABELS = {
  engen: "Engen", shell: "Shell", bp: "BP", sasol: "Sasol", caltex: "Caltex",
  astron: "Astron", total: "TotalEnergies", puma: "Puma",
};

function brandKey(text) {
  const t = text.toLowerCase();
  if (t.includes("engen")) return "engen";
  if (t.includes("shell")) return "shell";
  if (/\bbp\b/.test(t)) return "bp";
  if (t.includes("sasol")) return "sasol";
  if (t.includes("caltex")) return "caltex";
  if (t.includes("astron")) return "astron";
  if (t.includes("total")) return "total";
  if (t.includes("puma")) return "puma";
  return "other";
}

function toRow(el) {
  const pos = el.center || (el.lat != null ? { lat: el.lat, lon: el.lon } : null);
  if (!pos) return null;
  const tags = el.tags || {};
  const brand = brandKey(`${tags.brand || ""} ${tags.operator || ""} ${tags.name || ""}`);
  const brandLabel = brand === "other" ? tags.brand || "Independent" : BRAND_LABELS[brand];
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const area = tags["addr:suburb"] || tags["addr:city"] || "";
  return {
    id: `${el.type}-${el.id}`,
    name: tags.name || `${brandLabel} station`,
    brand,
    brand_label: brandLabel,
    latitude: pos.lat,
    longitude: pos.lon,
    address: [street, area].filter(Boolean).join(", ") || null,
    open_24h: tags.opening_hours === "24/7",
    updated_at: new Date().toISOString(),
  };
}

async function fetchTile([south, west, north, east]) {
  const query = `[out:json][timeout:90];nwr["amenity"="fuel"](${south},${west},${north},${east});out center tags;`;
  const errors = [];
  for (const url of OVERPASS_URLS) {
    try {
      const { data } = await axios.post(url, `data=${encodeURIComponent(query)}`, {
        timeout: 120000,
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "FuelWise/1.0 (station import)" },
      });
      return { elements: data.elements || [] };
    } catch (err) {
      errors.push(`${new URL(url).host}: ${describe(err)}`);
    }
  }
  return { elements: [], errors };
}

async function fetchAllSaStations() {
  const byId = new Map();
  const failedAreas = [];
  for (const tile of saTiles()) {
    const { elements, errors } = await fetchTile(tile);
    if (errors) {
      failedAreas.push({ area: tile, errors });
      console.warn(`[stations] area ${tile.join(",")} failed: ${errors.join(" | ")}`);
      continue;
    }
    for (const el of elements) {
      const row = toRow(el);
      if (row) byId.set(row.id, row);
    }
    console.log(`[stations] area ${tile.join(",")}: ${elements.length} stations`);
  }
  return { rows: [...byId.values()], failedAreas };
}

async function importStations() {
  const { rows, failedAreas } = await fetchAllSaStations();
  if (rows.length === 0) {
    const sample = failedAreas[0] ? failedAreas[0].errors.join(" | ") : "no stations returned";
    throw new Error(`Could not reach any OpenStreetMap server (${sample})`);
  }
  let written = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabase.from("fuel_stations").upsert(batch, { onConflict: "id" });
    if (error) throw error;
    written += batch.length;
  }
  const brands = rows.reduce((acc, r) => ((acc[r.brand] = (acc[r.brand] || 0) + 1), acc), {});
  return {
    stations: written,
    brands,
    areas_failed: failedAreas.length,
    note: failedAreas.length ? "Some areas failed; run the import again to fill them in." : undefined,
  };
}

module.exports = { importStations, brandKey, toRow, saTiles, describe };
