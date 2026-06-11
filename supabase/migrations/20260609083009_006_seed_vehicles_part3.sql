/*
# Seed Vehicles Catalog - Part 3: BMW, Mercedes, Isuzu, Renault, Suzuki

## Includes
- BMW: 3 Series, X3, X1, 1 Series
- Mercedes: C-Class, GLC, A-Class, GLA
- Isuzu: D-Max, mu-X
- Renault: Kwid, Duster, Triber, Captur
- Suzuki: Swift, Vitara Brezza, Baleno, Jimny, Ertiga, Ciaz
*/

INSERT INTO vehicles (make, model, variant, year_from, year_to, engine_cc, fuel_type, transmission, doors, official_l_per_100km, official_km_per_l, segment) VALUES
-- BMW
('BMW', '3 Series', '320i', 2020, 2026, 1998, 'petrol', 'automatic', 4, 6.3, 15.87, 'sedan'),
('BMW', '3 Series', '320d', 2020, 2026, 1995, 'diesel', 'automatic', 4, 4.8, 20.83, 'sedan'),
('BMW', 'X3', 'xDrive30i', 2020, 2026, 1998, 'petrol', 'automatic', 5, 7.1, 14.08, 'suv'),
('BMW', 'X3', 'xDrive20d', 2020, 2026, 1995, 'diesel', 'automatic', 5, 5.9, 16.95, 'suv'),
('BMW', 'X1', 'sDrive18i', 2020, 2026, 1499, 'petrol', 'automatic', 5, 6.1, 16.39, 'suv'),
('BMW', 'X1', 'sDrive18d', 2020, 2026, 1995, 'diesel', 'manual', 5, 4.7, 21.28, 'suv'),
('BMW', '1 Series', '118i', 2020, 2026, 1499, 'petrol', 'manual', 5, 5.8, 17.24, 'hatchback'),
('BMW', 'X5', 'xDrive40i', 2020, 2026, 2998, 'petrol', 'automatic', 5, 8.9, 11.24, 'suv'),
('BMW', 'X5', 'xDrive30d', 2020, 2026, 2993, 'diesel', 'automatic', 5, 6.5, 15.38, 'suv'),

-- MERCEDES-BENZ
('Mercedes-Benz', 'C-Class', 'C200', 2021, 2026, 1496, 'petrol', 'automatic', 4, 6.5, 15.38, 'sedan'),
('Mercedes-Benz', 'C-Class', 'C220d', 2021, 2026, 1993, 'diesel', 'automatic', 4, 4.8, 20.83, 'sedan'),
('Mercedes-Benz', 'GLC', 'GLC300', 2020, 2026, 1991, 'petrol', 'automatic', 5, 7.2, 13.89, 'suv'),
('Mercedes-Benz', 'GLC', 'GLC220d', 2020, 2026, 1950, 'diesel', 'automatic', 5, 5.6, 17.86, 'suve'),
('Mercedes-Benz', 'A-Class', 'A200', 2020, 2026, 1332, 'petrol', 'automatic', 5, 5.9, 16.95, 'hatchback'),
('Mercedes-Benz', 'GLA', 'GLA200', 2020, 2026, 1332, 'petrol', 'automatic', 5, 6.3, 15.87, 'suv'),
('Mercedes-Benz', 'GLB', 'GLB200', 2020, 2026, 1332, 'petrol', 'automatic', 5, 6.5, 15.38, 'suv'),
('Mercedes-Benz', 'E-Class', 'E220d', 2020, 2026, 1950, 'diesel', 'automatic', 4, 5.0, 20.00, 'sedan'),

-- ISUZU
('Isuzu', 'D-Max', '1.9 Ddi Double Cab', 2020, 2026, 1898, 'diesel', 'manual', 4, 7.7, 12.99, 'bakkie'),
('Isuzu', 'D-Max', '1.9 Ddi Double Cab AT', 2020, 2026, 1898, 'diesel', 'automatic', 4, 8.0, 12.50, 'bakkie'),
('Isuzu', 'D-Max', '3.0 Ddi Double Cab', 2020, 2026, 2999, 'diesel', 'manual', 4, 8.5, 11.76, 'bakkie'),
('Isuzu', 'mu-X', '1.9 4x2', 2020, 2026, 1898, 'diesel', 'automatic', 5, 8.0, 12.50, 'suv'),
('Isuzu', 'mu-X', '3.0 4x4', 2020, 2026, 2999, 'diesel', 'automatic', 5, 8.8, 11.36, 'suv'),
('Isuzu', 'D-Max', 'Le Single Cab', 2020, 2026, 1898, 'diesel', 'manual', 2, 7.5, 13.33, 'bakkie'),

-- RENAULT
('Renault', 'Kwid', '1.0 Expression', 2020, 2026, 999, 'petrol', 'manual', 5, 4.7, 21.28, 'hatchback'),
('Renault', 'Kwid', '1.0 Intens AMT', 2020, 2026, 999, 'petrol', 'automatic', 5, 4.9, 20.41, 'hatchback'),
('Renault', 'Duster', '1.6 Expression', 2020, 2026, 1598, 'petrol', 'manual', 5, 7.2, 13.89, 'suv'),
('Renault', 'Duster', '1.3 TCe EDC', 2020, 2026, 1333, 'petrol', 'automatic', 5, 6.5, 15.38, 'suv'),
('Renault', 'Triber', '1.0 Expression', 2021, 2026, 999, 'petrol', 'manual', 5, 5.4, 18.52, 'mpv'),
('Renault', 'Captur', '1.3 TCe', 2020, 2023, 1333, 'petrol', 'automatic', 5, 6.3, 15.87, 'suv'),
('Renault', 'Kiger', '1.0 Turbo', 2021, 2026, 999, 'petrol', 'manual', 5, 5.7, 17.54, 'suv'),

-- SUZUKI
('Suzuki', 'Swift', '1.2 GA', 2020, 2026, 1197, 'petrol', 'manual', 5, 4.9, 20.41, 'hatchback'),
('Suzuki', 'Swift', '1.2 GL AT', 2020, 2026, 1197, 'petrol', 'automatic', 5, 5.2, 19.23, 'hatchback'),
('Suzuki', 'Vitara Brezza', '1.5 GL', 2020, 2026, 1462, 'petrol', 'manual', 5, 6.0, 16.67, 'suv'),
('Suzuki', 'Vitara Brezza', '1.5 GL AT', 2020, 2026, 1462, 'petrol', 'automatic', 5, 6.3, 15.87, 'suv'),
('Suzuki', 'Baleno', '1.4 GLX', 2020, 2026, 1373, 'petrol', 'automatic', 5, 5.5, 18.18, 'hatchback'),
('Suzuki', 'Jimny', '1.5', 2020, 2026, 1462, 'petrol', 'manual', 3, 7.0, 14.29, 'suv'),
('Suzuki', 'Ertiga', '1.5 GL', 2020, 2026, 1462, 'petrol', 'manual', 5, 6.2, 16.13, 'mpv'),
('Suzuki', 'Ciaz', '1.4 GA', 2020, 2026, 1373, 'petrol', 'manual', 4, 5.6, 17.86, 'sedan'),
('Suzuki', 'Ertiga', '1.5 GL AT', 2020, 2026, 1462, 'petrol', 'automatic', 5, 6.5, 15.38, 'mpv'),
('Suzuki', 'Fronx', '1.0 Turbo', 2023, 2026, 998, 'petrol', 'manual', 5, 5.5, 18.18, 'suv'),
('Suzuki', 'Grand Vitara', '1.5 Hybrid', 2023, 2026, 1462, 'petrol', 'automatic', 5, 5.8, 17.24, 'suv');