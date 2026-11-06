/**
 * The live fuel_history table (whose fuel_key references fuel_types) uses
 * older names for the two diesel grades. The rest of the app and the
 * fuel_prices columns use the ppm names, so translate at that boundary.
 * Mirrors api/lib/fuelKeys.js.
 *
 *   diesel_50ppm  (0.005% sulphur) <-> diesel_ultra
 *   diesel_500ppm (0.05% sulphur)  <-> diesel_low_sulphur
 */
export const APP_TO_HISTORY_KEY: Record<string, string> = {
  unleaded_93: 'unleaded_93',
  unleaded_95: 'unleaded_95',
  diesel_50ppm: 'diesel_ultra',
  diesel_500ppm: 'diesel_low_sulphur',
};

export const HISTORY_TO_APP_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(APP_TO_HISTORY_KEY).map(([app, db]) => [db, app])
);

export const historyKey = (appKey: string) => APP_TO_HISTORY_KEY[appKey] ?? appKey;
export const appKey = (historyKey: string) => HISTORY_TO_APP_KEY[historyKey] ?? historyKey;

/** fuel_history months are 'YYYY-MM' (older rows 'YYYY-MM-01'); return 'YYYY-MM'. */
export const monthOf = (date: string) => date.slice(0, 7);

/** The month before a 'YYYY-MM' month, as 'YYYY-MM'. */
export function previousMonthOf(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}
