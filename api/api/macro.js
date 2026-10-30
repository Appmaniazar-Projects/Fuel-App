/**
 * GET /api/macro
 * Returns Brent Crude (USD/bbl) and ZAR/USD rate used in price build-up.
 */

const { withAuth }        = require("../lib/auth");
const { getLatestPrices } = require("../lib/scraper");
const { ok, error }       = require("../lib/respond");

module.exports = withAuth(async (req, res) => {
  try {
    const data = await getLatestPrices();
    return ok(res, {
      brent_crude_usd: data.macro.brent_crude_usd,
      zar_usd_rate:    data.macro.zar_usd_rate,
      effective_date:  data.effective_date,
    });
  } catch (err) {
    return error(res, 500, "Failed to retrieve macro data.");
  }
});
