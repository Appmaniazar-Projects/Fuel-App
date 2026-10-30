/**
 * lib/fuelKeys.js
 * The live fuel_history table uses older names for the two diesel grades
 * (its fuel_key references the fuel_types table). Everything else in the
 * API and app uses the ppm names, so translate at the database boundary.
 *
 *   diesel_50ppm  (0.005% sulphur) <-> diesel_ultra
 *   diesel_500ppm (0.05% sulphur)  <-> diesel_low_sulphur
 */

const APP_TO_HISTORY_KEY = {
  unleaded_93: "unleaded_93",
  unleaded_95: "unleaded_95",
  diesel_50ppm: "diesel_ultra",
  diesel_500ppm: "diesel_low_sulphur",
};

const HISTORY_TO_APP_KEY = Object.fromEntries(
  Object.entries(APP_TO_HISTORY_KEY).map(([app, db]) => [db, app])
);

module.exports = { APP_TO_HISTORY_KEY, HISTORY_TO_APP_KEY };
