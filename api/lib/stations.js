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
];

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

async function fetchAllSaStations() {
  const query =
    '[out:json][timeout:240];area["ISO3166-1"="ZA"][admin_level=2]->.za;nwr["amenity"="fuel"](area.za);out center tags;';
  let lastError;
  for (const url of OVERPASS_URLS) {
    try {
      const { data } = await axios.post(url, `data=${encodeURIComponent(query)}`, {
        timeout: 300000,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      return (data.elements || []).map(toRow).filter(Boolean);
    } catch (err) {
      lastError = err;
      console.warn(`[stations] ${url} failed: ${err.message}`);
    }
  }
  throw lastError || new Error("Overpass unavailable");
}

async function importStations() {
  const rows = await fetchAllSaStations();
  let written = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabase.from("fuel_stations").upsert(batch, { onConflict: "id" });
    if (error) throw error;
    written += batch.length;
  }
  const brands = rows.reduce((acc, r) => ((acc[r.brand] = (acc[r.brand] || 0) + 1), acc), {});
  return { stations: written, brands };
}

module.exports = { importStations, brandKey, toRow };
