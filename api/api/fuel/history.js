/**
 * GET /api/fuel/history
 * Monthly historical prices from the fuel_history table in Supabase.
 * Populated by the monthly update job (/api/fuel/update-monthly) with
 * genuinely scraped/sourced data — this never returns invented figures.
 *
 * Query params:
 *   fuel_key — e.g. unleaded_95, diesel_50ppm  (optional, returns all if omitted)
 *   from     — YYYY-MM-DD                      (optional)
 *   to       — YYYY-MM-DD                      (optional)
 */

const { withAuth }    = require("../../lib/auth");
const { FUEL_META }   = require("../../lib/scraper");
const { FuelPriceDB } = require("../../lib/supabase");
const { ok, error }   = require("../../lib/respond");

module.exports = withAuth(async (req, res) => {
  const { fuel_key, from, to } = req.query;

  if (fuel_key && !FUEL_META[fuel_key]) {
    return error(res, 400, `Unknown fuel_key "${fuel_key}". See /api/fuel/keys for valid keys.`);
  }

  try {
    const rows = await FuelPriceDB.getHistoricalPrices(fuel_key, from, to);

    const records = rows.map((r) => ({
      month: r.month,
      fuel_key: r.fuel_key,
      price_cents: r.price_cents,
      // Always derive from cents: the live column's default rounds to whole rands.
      price_rands: +(r.price_cents / 100).toFixed(2),
    }));

    return ok(res, {
      fuel_key: fuel_key || "all",
      from: from || records[0]?.month || "N/A",
      to: to || records[records.length - 1]?.month || "N/A",
      count: records.length,
      unit: "cents_per_litre",
      records,
    });
  } catch (err) {
    console.error("[/api/fuel/history]", err.message);
    return error(res, 500, "Database error occurred while fetching historical data.");
  }
});
