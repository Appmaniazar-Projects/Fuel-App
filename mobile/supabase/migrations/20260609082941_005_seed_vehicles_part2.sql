/*
# Seed Vehicles Catalog - Part 2: Hyundai, Kia, Nissan, Mazda

## Includes
- Hyundai: Tucson, i20, Creta, Venue, Santa Fe, i30
- Kia: Sportage, Picanto, Seltos, Rio, Cerato, Soul
- Nissan: NP200, Navara, X-Trail, Almera, Magnite
- Mazda: CX-5, CX-3, Mazda3, MX-5, BT-50
*/

INSERT INTO vehicles (make, model, variant, year_from, year_to, engine_cc, fuel_type, transmission, doors, official_l_per_100km, official_km_per_l, segment) VALUES
-- HYUNDAI
('Hyundai', 'Tucson', '2.0 Elite', 2021, 2026, 1999, 'petrol', 'manual', 5, 7.8, 12.82, 'suv'),
('Hyundai', 'Tucson', '2.0 Elite AT', 2021, 2026, 1999, 'petrol', 'automatic', 5, 8.1, 12.35, 'suv'),
('Hyundai', 'i20', '1.2 Motion', 2020, 2026, 1197, 'petrol', 'manual', 5, 5.5, 18.18, 'hatchback'),
('Hyundai', 'i20', '1.0T Fluid', 2020, 2026, 998, 'petrol', 'manual', 5, 5.2, 19.23, 'hatchback'),
('Hyundai', 'Creta', '1.6 Executive', 2022, 2026, 1591, 'petrol', 'automatic', 5, 6.8, 14.71, 'suv'),
('Hyundai', 'Venue', '1.2 Motion', 2020, 2026, 1197, 'petrol', 'manual', 5, 5.8, 17.24, 'suv'),
('Hyundai', 'Santa Fe', '2.2 CRDi', 2021, 2026, 2199, 'diesel', 'automatic', 5, 7.2, 13.89, 'suv'),
('Hyundai', 'i30', '1.4 Turbo', 2020, 2023, 1353, 'petrol', 'manual', 5, 5.9, 16.95, 'hatchback'),
('Hyundai', 'i30', '2.0 N Line AT', 2020, 2023, 1999, 'petrol', 'automatic', 5, 6.7, 14.93, 'hatchback'),

-- KIA
('Kia', 'Sportage', '2.0 LX', 2022, 2026, 1999, 'petrol', 'manual', 5, 7.9, 12.66, 'suv'),
('Kia', 'Sportage', '2.0 EX AT', 2022, 2026, 1999, 'petrol', 'automatic', 5, 8.2, 12.20, 'suv'),
('Kia', 'Picanto', '1.0 LX', 2020, 2026, 998, 'petrol', 'manual', 5, 4.8, 20.83, 'hatchback'),
('Kia', 'Picanto', '1.2 EX AT', 2020, 2026, 1243, 'petrol', 'automatic', 5, 5.4, 18.52, 'hatchback'),
('Kia', 'Seltos', '1.6 EX', 2020, 2026, 1591, 'petrol', 'automatic', 5, 6.5, 15.38, 'suv'),
('Kia', 'Rio', '1.4 LX', 2020, 2024, 1396, 'petrol', 'manual', 4, 5.7, 17.54, 'hatchback'),
('Kia', 'Cerato', '2.0 EX AT', 2020, 2024, 1999, 'petrol', 'automatic', 4, 7.2, 13.89, 'sedan'),
('Kia', 'Soul', '1.6', 2020, 2023, 1591, 'petrol', 'automatic', 5, 6.9, 14.49, 'suv'),
('Kia', 'Sorento', '2.2 CRDi', 2021, 2026, 2199, 'diesel', 'automatic', 5, 7.5, 13.33, 'suv'),

-- NISSAN
('Nissan', 'NP200', '1.6 8-valve', 2018, 2024, 1598, 'petrol', 'manual', 2, 8.4, 11.90, 'bakkie'),
('Nissan', 'NP200', '1.6 16-valve', 2018, 2024, 1598, 'petrol', 'manual', 2, 8.0, 12.50, 'bakkie'),
('Nissan', 'Navara', '2.5 dCi Double Cab', 2020, 2026, 2488, 'diesel', 'manual', 4, 8.2, 12.20, 'bakkie'),
('Nissan', 'Navara', '2.3 dCi Double Cab AT', 2020, 2026, 2298, 'diesel', 'automatic', 4, 7.9, 12.66, 'bakkie'),
('Nissan', 'X-Trail', '2.5 XE CVT', 2020, 2026, 2488, 'petrol', 'automatic', 5, 8.1, 12.35, 'suv'),
('Nissan', 'Almera', '1.5 Acenta', 2020, 2023, 1498, 'petrol', 'manual', 4, 5.9, 16.95, 'sedan'),
('Nissan', 'Magnite', '1.0 Turbo', 2021, 2026, 999, 'petrol', 'manual', 5, 6.0, 16.67, 'suv'),
('Nissan', 'Qashqai', '1.3 dig-T', 2022, 2026, 1332, 'petrol', 'manual', 5, 6.1, 16.39, 'suv'),

-- MAZDA
('Mazda', 'CX-5', '2.0 Active', 2020, 2026, 1998, 'petrol', 'manual', 5, 7.0, 14.29, 'suv'),
('Mazda', 'CX-5', '2.5 Individual AT', 2020, 2026, 2488, 'petrol', 'automatic', 5, 7.4, 13.51, 'suv'),
('Mazda', 'CX-3', '2.0 Active', 2020, 2026, 1998, 'petrol', 'manual', 5, 6.4, 15.63, 'suv'),
('Mazda', 'Mazda3', '2.0 Individual', 2020, 2026, 1998, 'petrol', 'manual', 4, 6.2, 16.13, 'hatchback'),
('Mazda', 'MX-5', '2.0 RF', 2020, 2026, 1998, 'petrol', 'manual', 2, 6.9, 14.49, 'sports'),
('Mazda', 'BT-50', '1.9 TD Double Cab', 2020, 2026, 1900, 'diesel', 'manual', 4, 7.8, 12.82, 'bakkie'),
('Mazda', 'BT-50', '3.0 TD Double Cab AT', 2020, 2026, 2999, 'diesel', 'automatic', 4, 8.4, 11.90, 'bakkie'),
('Mazda', 'CX-30', '2.0 Individual', 2020, 2026, 1998, 'petrol', 'automatic', 5, 6.7, 14.93, 'suv');