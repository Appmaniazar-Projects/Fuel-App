/**
 * GET /api/fuel/current
 *
 * Returns the latest official SA fuel prices, scraped live from FIASA with
 * an honest, dated fallback if the live scrape is unavailable (see
 * lib/scraper.js). This always reflects the live/latest scrape rather than
 * a saved database copy — the database (fuel_prices/fuel_history) is the
 * record of what's been published, kept current by the monthly job at
 * /api/fuel/update-monthly, not the source /current reads from.
 *
 * Query params:
 *   type    — petrol | diesel | paraffin | lpg  (optional, default: all)
 *   region  — inland | coastal                  (optional, default: inland)
 *   format  — cents | rands                     (optional, default: cents)
 */

const { withAuth }        = require("../../lib/auth");
const { getLatestPrices } = require("../../lib/scraper");
const { ok, error }       = require("../../lib/respond");

module.exports = withAuth(async (req, res) => {
  const { type, region, format } = req.query;

  try {
    const data = await getLatestPrices(region === "coastal" ? "coastal" : "inland");

    let fuels = data.fuels;
    if (type) {
      fuels = fuels.filter((f) => f.type.toLowerCase() === type.toLowerCase());
    }
    if (format === "rands") {
      fuels = fuels.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        grade: f.grade,
        price: f.price_rands,
        prev: +(f.prev / 100).toFixed(2),
        change: +(f.change / 100).toFixed(2),
        direction: f.direction,
      }));
    }

    return ok(res, {
      effective_date: data.effective_date,
      next_revision: data.next_revision,
      region: data.region,
      currency: data.currency,
      unit: format === "rands" ? "rands_per_litre" : data.unit,
      fuels,
      macro: data.macro,
      _meta: data._meta,
    });
  } catch (err) {
    console.error("[/api/fuel/current]", err.message);
    return error(res, 500, "Failed to fetch fuel prices");
  }
});
