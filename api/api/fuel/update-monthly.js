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
 * (which allows GET and POST) rather than a POST-only wrapper. Because
 * Vercel Cron can't set custom headers, authenticate it by including the
 * key in the cron path's query string in vercel.json, e.g.:
 *   "path": "/api/fuel/update-monthly?api_key=YOUR_KEY"
 */

const { withAuth } = require("../../lib/auth");
const { fetchMonthlyPrices } = require("../../lib/scraper");
const { FuelPriceDB } = require("../../lib/supabase");
const { ok, error } = require("../../lib/respond");

const REGIONS = ["gauteng", "coastal"];

module.exports = withAuth(async (req, res) => {
  const results = [];

  try {
    for (const region of REGIONS) {
      const snapshot = await fetchMonthlyPrices(region);

      const saved = await FuelPriceDB.upsertCurrentPrices(
        snapshot.region,
        snapshot.prices,
        snapshot.source
      );

      const month = `${snapshot.effective_date.slice(0, 7)}-01`;
      const historyRows = Object.entries(snapshot.prices).map(([fuel_key, price_cents]) => ({
        month,
        fuel_key,
        price_cents,
      }));
      const historySaved = await FuelPriceDB.addHistoricalData(historyRows);

      results.push({
        region: snapshot.region,
        source: snapshot.source,
        current_row_id: saved.id,
        history_rows_added: historySaved.length,
      });
    }

    return ok(res, { success: true, results });
  } catch (err) {
    console.error("[/api/fuel/update-monthly]", err.message);
    return error(res, 500, err.message || "Failed to update monthly prices");
  }
});
