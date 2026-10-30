/**
 * GET or POST /api/stations/import
 * One-off (or occasional) import of every South African fuel station from
 * OpenStreetMap into the fuel_stations table. Takes 1-3 minutes.
 */

const { withAuth } = require("../../lib/auth");
const { importStations } = require("../../lib/stations");
const { ok, error } = require("../../lib/respond");

module.exports = withAuth(async (req, res) => {
  try {
    const result = await importStations();
    return ok(res, result);
  } catch (err) {
    console.error("[/api/stations/import]", err.message);
    return error(res, 500, err.message || "Station import failed");
  }
});
