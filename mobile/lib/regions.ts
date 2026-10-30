/**
 * Picks which of the app's two price regions applies at a location.
 * SA fuel is priced by zone: coastal zones are cheapest, inland zones add
 * transport costs. The app only has Gauteng Inland and Western Cape Coastal
 * price feeds, so this is an estimate: coastal provinces' coastal belt uses
 * the coastal price, everywhere else uses the Gauteng (inland) price.
 */
export type PriceRegion = 'coastal' | 'inland';

export function regionForLocation(lat: number, lng: number): PriceRegion {
  // Western Cape and southern/western coastal belt
  if (lat < -31.5 && lng < 24) return 'coastal';
  // Eastern Cape coast (Garden Route to East London)
  if (lat < -32.5 && lng >= 24 && lng < 28.5) return 'coastal';
  // KwaZulu-Natal coast (Port Shepstone to Richards Bay)
  if (lat < -28.5 && lat > -31.2 && lng > 30.4) return 'coastal';
  return 'inland';
}

export const REGION_DB_KEY: Record<PriceRegion, string> = {
  coastal: 'Western Cape Coastal',
  inland: 'Gauteng Inland',
};

export const REGION_LABEL: Record<PriceRegion, string> = {
  coastal: 'Coastal',
  inland: 'Inland',
};
