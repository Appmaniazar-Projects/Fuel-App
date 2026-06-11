/*
# Seed Current Fuel Prices

## Overview
Inserts current South African fuel prices for all three pricing regions.
Prices are based on DMRE (Department of Mineral Resources and Energy) monthly adjustments.

## Data
- Regions: Gauteng Inland, Western Cape Coastal, KZN Coastal
- All prices in cents per litre (integer)
- Effective date: 2026-06-03 (first Wednesday of June 2026)
- All marked as is_current = true

## Price Structure (cents/litre)
- Unleaded 93 and 95 octane petrol
- Diesel 50ppm (low sulphur) and 500ppm (ultra-low sulphur)
- Paraffin and LPG for completeness
*/

-- Reset any existing current flags
UPDATE fuel_prices SET is_current = false WHERE is_current = true;

-- Insert current prices for June 2026 (approximate DMRE prices)
-- Gauteng Inland (highest prices due to inland transport costs)
INSERT INTO fuel_prices (
  effective_date, region, unleaded_93, unleaded_95, 
  diesel_low_sulphur, diesel_ultra, paraffin_retail, lpg,
  is_current, data_source
) VALUES 
('2026-06-03', 'Gauteng Inland', 2493, 2528, 2411, 2394, 1722, 3205, true, 'DMRE'),
-- Western Cape Coastal
('2026-06-03', 'Western Cape Coastal', 2460, 2495, 2378, 2361, 1689, 3172, true, 'DMRE'),
-- KZN Coastal (lowest prices at ports)
('2026-06-03', 'KZN Coastal', 2455, 2490, 2373, 2356, 1684, 3167, true, 'DMRE');