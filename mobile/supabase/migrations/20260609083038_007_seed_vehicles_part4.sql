/*
# Seed Vehicles Catalog - Part 4: Mitsubishi, Opel, Honda, Haval, GWM, Chery

## Includes
- Mitsubishi: Triton, Pajero Sport, ASX, Outlander
- Opel: Corsa, Mokka, Astra
- Honda: Jazz, CR-V, City, HR-V
- Haval: Jolion, H6
- GWM: Steed, P-Series
- Chery: Tiggo
*/

INSERT INTO vehicles (make, model, variant, year_from, year_to, engine_cc, fuel_type, transmission, doors, official_l_per_100km, official_km_per_l, segment) VALUES
-- MITSUBISHI
('Mitsubishi', 'Triton', '2.4 DI-D Double Cab', 2020, 2026, 2442, 'diesel', 'manual', 4, 8.0, 12.50, 'bakkie'),
('Mitsubishi', 'Triton', '2.4 DI-D Double Cab AT', 2020, 2026, 2442, 'diesel', 'automatic', 4, 8.3, 12.05, 'bakkie'),
('Mitsubishi', 'Pajero Sport', '2.4 DI-D', 2020, 2026, 2442, 'diesel', 'automatic', 5, 8.2, 12.20, 'suv'),
('Mitsubishi', 'ASX', '2.0', 2020, 2023, 1998, 'petrol', 'manual', 5, 7.3, 13.70, 'suv'),
('Mitsubishi', 'ASX', '2.0 CVT', 2020, 2023, 1998, 'petrol', 'automatic', 5, 7.6, 13.16, 'suv'),
('Mitsubishi', 'Outlander', '2.4', 2020, 2023, 2360, 'petrol', 'automatic', 5, 7.8, 12.82, 'suv'),
('Mitsubishi', 'Eclipse Cross', '1.5T', 2020, 2023, 1499, 'petrol', 'automatic', 5, 6.8, 14.71, 'suv'),

-- OPEL
('Opel', 'Corsa', '1.2 Turbo', 2021, 2026, 1199, 'petrol', 'manual', 5, 5.5, 18.18, 'hatchback'),
('Opel', 'Corsa', '1.2 Turbo AT', 2021, 2026, 1199, 'petrol', 'automatic', 5, 5.8, 17.24, 'hatchback'),
('Opel', 'Mokka', '1.2 Turbo', 2021, 2026, 1199, 'petrol', 'automatic', 5, 6.1, 16.39, 'suv'),
('Opel', 'Astra', '1.4 Turbo', 2020, 2023, 1399, 'petrol', 'automatic', 5, 6.2, 16.13, 'hatchback'),
('Opel', 'Grandland X', '1.5 Turbo', 2020, 2023, 1499, 'petrol', 'automatic', 5, 6.7, 14.93, 'suv'),

-- HONDA
('Honda', 'Jazz', '1.5', 2020, 2026, 1497, 'petrol', 'manual', 5, 5.7, 17.54, 'hatchback'),
('Honda', 'Jazz', '1.5 CVT', 2020, 2026, 1497, 'petrol', 'automatic', 5, 6.0, 16.67, 'hatchback'),
('Honda', 'CR-V', '1.5T', 2020, 2026, 1498, 'petrol', 'automatic', 5, 6.8, 14.71, 'suv'),
('Honda', 'CR-V', '1.6 i-DTEC', 2020, 2023, 1597, 'diesel', 'automatic', 5, 5.5, 18.18, 'suv'),
('Honda', 'City', '1.5', 2020, 2026, 1497, 'petrol', 'manual', 4, 5.8, 17.24, 'sedan'),
('Honda', 'HR-V', '1.5', 2020, 2026, 1497, 'petrol', 'automatic', 5, 6.2, 16.13, 'suv'),
('Honda', 'WR-V', '1.2', 2020, 2021, 1199, 'petrol', 'manual', 5, 5.9, 16.95, 'suv'),

-- HAVAL
('Haval', 'Jolion', '1.5T', 2021, 2026, 1497, 'petrol', 'automatic', 5, 7.0, 14.29, 'suv'),
('Haval', 'Jolion', '1.5T Hybrid', 2022, 2026, 1497, 'petrol', 'automatic', 5, 5.8, 17.24, 'suv'),
('Haval', 'H6', '2.0T', 2021, 2026, 1967, 'petrol', 'automatic', 5, 8.2, 12.20, 'suv'),
('Haval', 'H6', '1.5T', 2021, 2026, 1497, 'petrol', 'automatic', 5, 7.5, 13.33, 'suv'),

-- GWM
('GWM', 'Steed', '2.0 VGTi', 2020, 2023, 1996, 'diesel', 'manual', 2, 8.5, 11.76, 'bakkie'),
('GWM', 'P-Series', '2.0 TD Double Cab', 2021, 2026, 1996, 'diesel', 'automatic', 4, 8.3, 12.05, 'bakkie'),
('GWM', 'P-Series', '2.0T Petrol', 2021, 2026, 1996, 'petrol', 'automatic', 4, 9.2, 10.87, 'bakkie'),
('GWM', 'Tank 300', '2.0T', 2023, 2026, 1996, 'petrol', 'automatic', 5, 10.5, 9.52, 'suv'),

-- CHERY
('Chery', 'Tiggo 4 Pro', '1.5T', 2022, 2026, 1498, 'petrol', 'automatic', 5, 7.0, 14.29, 'suv'),
('Chery', 'Tiggo 7 Pro', '1.6T', 2021, 2026, 1598, 'petrol', 'automatic', 5, 7.8, 12.82, 'suv'),
('Chery', 'Tiggo 8 Pro', '1.6T', 2021, 2026, 1598, 'petrol', 'automatic', 5, 8.0, 12.50, 'suv'),

-- MAHINDRA
('Mahindra', 'Scorpio', '2.2 mHawk', 2020, 2026, 2179, 'diesel', 'manual', 5, 8.0, 12.50, 'suv'),
('Mahindra', 'XUV700', '2.2 mHawk', 2022, 2026, 2184, 'diesel', 'manual', 5, 7.2, 13.89, 'suv'),
('Mahindra', 'XUV700', '2.2 mHawk AT', 2022, 2026, 2184, 'diesel', 'automatic', 5, 7.6, 13.16, 'suv'),
('Mahindra', 'Bolero', '2.5', 2020, 2026, 2523, 'diesel', 'manual', 5, 8.5, 11.76, 'bakkie'),

-- TOYOTA ADDITIONAL
('Toyota', 'Quantum', '2.8 GD-6', 2020, 2026, 2755, 'diesel', 'automatic', 4, 9.5, 10.53, 'mpv'),
('Toyota', 'Innova', '2.0', 2020, 2026, 1998, 'petrol', 'automatic', 5, 8.2, 12.20, 'mpv'),
('Toyota', 'LC 79', '4.2 D', 2020, 2026, 4164, 'diesel', 'manual', 2, 11.0, 9.09, 'bakkie'),

-- VOLKSWAGEN ADDITIONAL  
('Volkswagen', 'Amarok', '2.0 TDI', 2020, 2024, 1968, 'diesel', 'manual', 4, 8.0, 12.50, 'bakkie'),
('Volkswagen', 'Amarok', '3.0 TDI', 2020, 2024, 2967, 'diesel', 'automatic', 4, 9.0, 11.11, 'bakkie'),
('Volkswagen', 'Caddy', '1.6 TDI', 2020, 2026, 1598, 'diesel', 'manual', 5, 5.9, 16.95, 'mpv');