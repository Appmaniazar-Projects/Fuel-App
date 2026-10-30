/*
# Seed Vehicles Catalog - Part 1: Toyota, VW, Ford

## Overview
Seeds the vehicles reference table with popular South African vehicle models.
Each entry includes official fuel consumption figures in both L/100km and km/L.

## Data Sources
- Manufacturer published specifications
- South African model variants

## Includes
- Toyota: Hilux, Corolla, Fortuner, Etios, Land Cruiser, RAV4, Starlet, Urban Cruiser, Avanza, Yaris
- Volkswagen: Polo, Golf, Tiguan, Polo Vivo, T-Cross, Taigo, ID.4
- Ford: Ranger, EcoSport, Everest, Fiesta, Kuga, Puma
*/

INSERT INTO vehicles (make, model, variant, year_from, year_to, engine_cc, fuel_type, transmission, doors, official_l_per_100km, official_km_per_l, segment) VALUES
-- TOYOTA
('Toyota', 'Hilux', '2.4 GD-6 Double Cab', 2020, 2026, 2393, 'diesel', 'manual', 4, 8.1, 12.35, 'bakkie'),
('Toyota', 'Hilux', '2.4 GD-6 Double Cab AT', 2020, 2026, 2393, 'diesel', 'automatic', 4, 8.6, 11.63, 'bakkie'),
('Toyota', 'Hilux', '2.8 GD-6 Double Cab', 2020, 2026, 2755, 'diesel', 'manual', 4, 7.9, 12.66, 'bakkie'),
('Toyota', 'Hilux', '2.8 GD-6 Double Cab AT', 2020, 2026, 2755, 'diesel', 'automatic', 4, 8.3, 12.05, 'bakkie'),
('Toyota', 'Corolla', '1.8 XS', 2020, 2026, 1798, 'petrol', 'manual', 4, 6.5, 15.38, 'sedan'),
('Toyota', 'Corolla', '1.8 XS CVT', 2020, 2026, 1798, 'petrol', 'automatic', 4, 6.8, 14.71, 'sedan'),
('Toyota', 'Corolla', '2.0 XR CVT', 2020, 2026, 1987, 'petrol', 'automatic', 4, 6.2, 16.13, 'sedan'),
('Toyota', 'Fortuner', '2.4 GD-6', 2020, 2026, 2393, 'diesel', 'manual', 5, 8.4, 11.90, 'suv'),
('Toyota', 'Fortuner', '2.4 GD-6 AT', 2020, 2026, 2393, 'diesel', 'automatic', 5, 8.9, 11.24, 'suv'),
('Toyota', 'Fortuner', '2.8 GD-4 AT', 2020, 2026, 2755, 'diesel', 'automatic', 5, 8.1, 12.35, 'suv'),
('Toyota', 'Etios', '1.5 Xs', 2018, 2022, 1496, 'petrol', 'manual', 4, 6.3, 15.87, 'hatchback'),
('Toyota', 'Land Cruiser', '300 3.3 GD', 2022, 2026, 3346, 'diesel', 'automatic', 5, 9.5, 10.53, 'suv'),
('Toyota', 'RAV4', '2.5 VX CVT', 2020, 2026, 2487, 'petrol', 'automatic', 5, 7.1, 14.08, 'suv'),
('Toyota', 'RAV4', '2.0 GX', 2020, 2026, 1987, 'petrol', 'manual', 5, 7.5, 13.33, 'suv'),
('Toyota', 'Starlet', '1.4 Xs', 2021, 2026, 1388, 'petrol', 'automatic', 5, 5.8, 17.24, 'hatchback'),
('Toyota', 'Urban Cruiser', '1.5 Xs', 2021, 2026, 1490, 'petrol', 'automatic', 5, 6.1, 16.39, 'suv'),
('Toyota', 'Avanza', '1.5 Xs', 2022, 2026, 1496, 'petrol', 'manual', 5, 6.5, 15.38, 'mpv'),
('Toyota', 'Yaris', '1.5 Xs CVT', 2020, 2026, 1490, 'petrol', 'automatic', 4, 5.2, 19.23, 'hatchback'),
('Toyota', 'Yaris Cross', '1.5 Xs CVT', 2022, 2026, 1490, 'petrol', 'automatic', 5, 5.8, 17.24, 'suv'),

-- VOLKSWAGEN
('Volkswagen', 'Polo', '1.6 Trendline', 2018, 2026, 1598, 'petrol', 'manual', 4, 5.9, 16.95, 'hatchback'),
('Volkswagen', 'Polo', '1.6 Comfortline AT', 2018, 2026, 1598, 'petrol', 'automatic', 4, 6.2, 16.13, 'hatchback'),
('Volkswagen', 'Polo', '1.0 TSI Highline', 2020, 2026, 999, 'petrol', 'manual', 4, 5.4, 18.52, 'hatchback'),
('Volkswagen', 'Golf', '1.4 TSI', 2020, 2026, 1395, 'petrol', 'manual', 5, 5.9, 16.95, 'hatchback'),
('Volkswagen', 'Golf', '2.0 TDI', 2020, 2026, 1968, 'diesel', 'automatic', 5, 4.9, 20.41, 'hatchback'),
('Volkswagen', 'Tiguan', '1.4 TSI', 2020, 2026, 1395, 'petrol', 'automatic', 5, 6.8, 14.71, 'suv'),
('Volkswagen', 'Tiguan', '2.0 TDI', 2020, 2026, 1968, 'diesel', 'automatic', 5, 6.1, 16.39, 'suv'),
('Volkswagen', 'Polo Vivo', '1.4 Trendline', 2018, 2026, 1390, 'petrol', 'manual', 4, 5.7, 17.54, 'hatchback'),
('Volkswagen', 'Polo Vivo', '1.6 Comfortline AT', 2018, 2026, 1598, 'petrol', 'automatic', 4, 6.1, 16.39, 'hatchback'),
('Volkswagen', 'T-Cross', '1.0 TSI', 2020, 2026, 999, 'petrol', 'manual', 5, 5.6, 17.86, 'suv'),
('Volkswagen', 'T-Cross', '1.5 TSI AT', 2020, 2026, 1498, 'petrol', 'automatic', 5, 6.0, 16.67, 'suv'),
('Volkswagen', 'Taigo', '1.5 TSI', 2022, 2026, 1498, 'petrol', 'automatic', 5, 6.0, 16.67, 'suv'),

-- FORD
('Ford', 'Ranger', '2.2 TDCi Double Cab', 2020, 2022, 2198, 'diesel', 'manual', 4, 7.9, 12.66, 'bakkie'),
('Ford', 'Ranger', '2.0 Bi-Turbo Double Cab AT', 2020, 2026, 1996, 'diesel', 'automatic', 4, 8.1, 12.35, 'bakkie'),
('Ford', 'Ranger', '3.2 TDCi Double Cab', 2020, 2022, 3198, 'diesel', 'automatic', 4, 9.1, 10.99, 'bakkie'),
('Ford', 'EcoSport', '1.5 Ti-VCT', 2018, 2023, 1498, 'petrol', 'manual', 5, 6.6, 15.15, 'suv'),
('Ford', 'EcoSport', '1.5 Ti-VCT AT', 2018, 2023, 1498, 'petrol', 'automatic', 5, 6.9, 14.49, 'suv'),
('Ford', 'Everest', '2.0 Bi-Turbo', 2020, 2026, 1996, 'diesel', 'automatic', 5, 7.9, 12.66, 'suv'),
('Ford', 'Everest', '3.2 TDCi', 2020, 2022, 3198, 'diesel', 'automatic', 5, 9.2, 10.87, 'suv'),
('Ford', 'Fiesta', '1.6 Ambiente', 2018, 2020, 1596, 'petrol', 'manual', 4, 5.9, 16.95, 'hatchback'),
('Ford', 'Kuga', '2.0 TDCi', 2020, 2023, 1997, 'diesel', 'automatic', 5, 6.2, 16.13, 'suv'),
('Ford', 'Puma', '1.0 EcoBoost', 2021, 2026, 999, 'petrol', 'manual', 5, 5.6, 17.86, 'suv');