/**
 * GET /api/fuel/changes
 * Month-on-month price movements for all fuel types.
 */

const { withAuth }        = require("../../lib/auth");
const { getLatestPrices } = require("../../lib/scraper");
const { ok, error }       = require("../../lib/respond");

module.exports = withAuth(async (req, res) => {
  try {
    const data = await getLatestPrices();

    const movements = data.fuels.map(f => ({
      key:       f.key,
      label:     f.label,
      type:      f.type,
      change_cents: f.change,
      change_rands: +(f.change / 100).toFixed(2),
      direction: f.direction,
      prev_price:    f.prev,
      current_price: f.price,
    }));

    const summary = {
      increases: movements.filter(m => m.direction === "increase").length,
      decreases: movements.filter(m => m.direction === "decrease").length,
      unchanged: movements.filter(m => m.direction === "unchanged").length,
    };

    return ok(res, {
      effective_date: data.effective_date,
      summary,
      movements,
    });

  } catch (err) {
    console.error("[/api/fuel/changes]", err.message);
    return error(res, 500, "Failed to retrieve price changes.");
  }
});
