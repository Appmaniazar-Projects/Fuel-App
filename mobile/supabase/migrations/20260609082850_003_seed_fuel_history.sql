/*
# Seed Historical Fuel Prices

## Overview
Inserts 12 months of historical fuel price data for trend analysis.
All prices are for Gauteng Inland region as the primary reference.

## Data
- Months: July 2025 through June 2026
- Fuel types: unleaded_93, unleaded_95, diesel_50ppm, diesel_500ppm
- Prices in cents per litre
- Data reflects typical DMRE monthly adjustments
*/

INSERT INTO fuel_history (month, fuel_key, price_cents) VALUES
-- July 2025
('2025-07-01', 'unleaded_93', 2342),
('2025-07-01', 'unleaded_95', 2377),
('2025-07-01', 'diesel_50ppm', 2261),
('2025-07-01', 'diesel_500ppm', 2244),
-- August 2025
('2025-08-01', 'unleaded_93', 2389),
('2025-08-01', 'unleaded_95', 2424),
('2025-08-01', 'diesel_50ppm', 2305),
('2025-08-01', 'diesel_500ppm', 2288),
-- September 2025
('2025-09-01', 'unleaded_93', 2352),
('2025-09-01', 'unleaded_95', 2387),
('2025-09-01', 'diesel_50ppm', 2270),
('2025-09-01', 'diesel_500ppm', 2253),
-- October 2025
('2025-10-01', 'unleaded_93', 2405),
('2025-10-01', 'unleaded_95', 2440),
('2025-10-01', 'diesel_50ppm', 2322),
('2025-10-01', 'diesel_500ppm', 2305),
-- November 2025
('2025-11-01', 'unleaded_93', 2434),
('2025-11-01', 'unleaded_95', 2469),
('2025-11-01', 'diesel_50ppm', 2349),
('2025-11-01', 'diesel_500ppm', 2332),
-- December 2025
('2025-12-01', 'unleaded_93', 2387),
('2025-12-01', 'unleaded_95', 2422),
('2025-12-01', 'diesel_50ppm', 2310),
('2025-12-01', 'diesel_500ppm', 2293),
-- January 2026
('2026-01-01', 'unleaded_93', 2365),
('2026-01-01', 'unleaded_95', 2400),
('2026-01-01', 'diesel_50ppm', 2288),
('2026-01-01', 'diesel_500ppm', 2271),
-- February 2026
('2026-02-01', 'unleaded_93', 2412),
('2026-02-01', 'unleaded_95', 2447),
('2026-02-01', 'diesel_50ppm', 2333),
('2026-02-01', 'diesel_500ppm', 2316),
-- March 2026
('2026-03-01', 'unleaded_93', 2445),
('2026-03-01', 'unleaded_95', 2480),
('2026-03-01', 'diesel_50ppm', 2366),
('2026-03-01', 'diesel_500ppm', 2349),
-- April 2026
('2026-04-01', 'unleaded_93', 2468),
('2026-04-01', 'unleaded_95', 2503),
('2026-04-01', 'diesel_50ppm', 2389),
('2026-04-01', 'diesel_500ppm', 2372),
-- May 2026
('2026-05-01', 'unleaded_93', 2475),
('2026-05-01', 'unleaded_95', 2510),
('2026-05-01', 'diesel_50ppm', 2396),
('2026-05-01', 'diesel_500ppm', 2379),
-- June 2026 (current)
('2026-06-01', 'unleaded_93', 2493),
('2026-06-01', 'unleaded_95', 2528),
('2026-06-01', 'diesel_50ppm', 2411),
('2026-06-01', 'diesel_500ppm', 2394);