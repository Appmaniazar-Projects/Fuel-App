/**
 * GET /api/fuel/keys
 * Returns all valid fuel keys and their metadata. No auth required.
 */

const { FUEL_META } = require("../../lib/scraper");
const { ok }        = require("../../lib/respond");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const keys = Object.entries(FUEL_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    type:  meta.type,
    grade: meta.grade,
  }));

  return ok(res, { count: keys.length, keys });
};
