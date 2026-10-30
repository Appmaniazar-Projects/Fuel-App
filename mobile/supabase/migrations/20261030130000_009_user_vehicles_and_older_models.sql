/*
# Older models + "My car isn't listed"

1. Lets signed-in users add their own car to `vehicles`. Their rows are
   private: `created_by` marks them, and RLS only shows a user the shared
   catalogue (created_by IS NULL) plus their own cars.
2. Adds earlier generations of the cars most common on South African roads.
   The original catalogue only covered 2018+ models.

   Official consumption figures are left NULL for these older generations
   rather than guessed. The app still tracks real km/L for them; it just
   doesn't show the "vs spec" comparison until a verified figure is added.
   Year ranges are the SA sales years of each generation.

Safe to re-run: the column/policies are guarded and every insert skips
rows that already exist.
*/

-- 1. User-added cars ---------------------------------------------------------
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Replace the public read policy so private cars aren't visible to others.
-- If the live database has a differently named SELECT policy on vehicles,
-- drop that too (see the note at the bottom).
DROP POLICY IF EXISTS "anon_read_vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "read_catalogue_and_own_vehicles" ON public.vehicles;
CREATE POLICY "read_catalogue_and_own_vehicles" ON public.vehicles FOR SELECT
  TO anon, authenticated
  USING (created_by IS NULL OR created_by = auth.uid());

DROP POLICY IF EXISTS "insert_own_vehicles" ON public.vehicles;
CREATE POLICY "insert_own_vehicles" ON public.vehicles FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- 2. Older generations of common SA cars -------------------------------------
INSERT INTO public.vehicles (make, model, variant, year_from, year_to, fuel_type, transmission, segment)
SELECT v.make, v.model, v.variant, v.year_from, v.year_to, v.fuel_type, v.transmission, v.segment
FROM (VALUES
  -- Volkswagen
  ('Volkswagen', 'Citi Golf',  '1.4i',                     1984, 2009, 'petrol', 'manual',    'hatchback'),
  ('Volkswagen', 'Citi Golf',  '1.6i',                     1984, 2009, 'petrol', 'manual',    'hatchback'),
  ('Volkswagen', 'Polo Vivo',  '1.4 (1st gen)',            2010, 2018, 'petrol', 'manual',    'hatchback'),
  ('Volkswagen', 'Polo Vivo',  '1.6 (1st gen)',            2010, 2018, 'petrol', 'manual',    'hatchback'),
  ('Volkswagen', 'Polo',       '1.4 (9N)',                 2002, 2009, 'petrol', 'manual',    'hatchback'),
  ('Volkswagen', 'Polo',       '1.6 Classic (9N)',         2002, 2009, 'petrol', 'manual',    'sedan'),
  ('Volkswagen', 'Polo',       '1.4 (6R)',                 2010, 2017, 'petrol', 'manual',    'hatchback'),
  ('Volkswagen', 'Polo',       '1.2 TSI (6R)',             2010, 2017, 'petrol', 'manual',    'hatchback'),
  ('Volkswagen', 'Polo',       '1.6 TDI (6R)',             2010, 2017, 'diesel', 'manual',    'hatchback'),
  ('Volkswagen', 'Golf',       '1.6 (Golf 5)',             2004, 2009, 'petrol', 'manual',    'hatchback'),
  ('Volkswagen', 'Golf',       '2.0 GTI (Golf 5)',         2005, 2009, 'petrol', 'manual',    'hatchback'),
  ('Volkswagen', 'Golf',       '1.4 TSI (Golf 6)',         2009, 2013, 'petrol', 'manual',    'hatchback'),
  ('Volkswagen', 'Golf',       '2.0 TDI (Golf 6)',         2009, 2013, 'diesel', 'manual',    'hatchback'),
  ('Volkswagen', 'Golf',       '1.4 TSI (Golf 7)',         2013, 2020, 'petrol', 'manual',    'hatchback'),
  ('Volkswagen', 'Jetta',      '1.6 (Jetta 5)',            2006, 2011, 'petrol', 'manual',    'sedan'),
  ('Volkswagen', 'Jetta',      '1.4 TSI (Jetta 6)',        2011, 2018, 'petrol', 'manual',    'sedan'),
  -- Toyota
  ('Toyota', 'Tazz',           '1.3',                      1996, 2006, 'petrol', 'manual',    'hatchback'),
  ('Toyota', 'Corolla',        '1.6 (2002-2007)',          2002, 2007, 'petrol', 'manual',    'sedan'),
  ('Toyota', 'Corolla',        '1.6 Professional (2007-2014)', 2007, 2014, 'petrol', 'manual', 'sedan'),
  ('Toyota', 'Corolla Quest',  '1.6',                      2014, 2020, 'petrol', 'manual',    'sedan'),
  ('Toyota', 'Yaris',          '1.3 T3 (2005-2011)',       2005, 2011, 'petrol', 'manual',    'hatchback'),
  ('Toyota', 'Etios',          '1.5 (2012-2017)',          2012, 2017, 'petrol', 'manual',    'hatchback'),
  ('Toyota', 'Hilux',          '2.5 D-4D (2005-2016)',     2005, 2016, 'diesel', 'manual',    'bakkie'),
  ('Toyota', 'Hilux',          '3.0 D-4D (2005-2016)',     2005, 2016, 'diesel', 'manual',    'bakkie'),
  ('Toyota', 'Hilux',          '2.7 VVTi (2005-2016)',     2005, 2016, 'petrol', 'manual',    'bakkie'),
  ('Toyota', 'Fortuner',       '3.0 D-4D (2005-2016)',     2005, 2016, 'diesel', 'manual',    'suv'),
  ('Toyota', 'Fortuner',       '3.0 D-4D AT (2005-2016)',  2005, 2016, 'diesel', 'automatic', 'suv'),
  ('Toyota', 'Avanza',         '1.5 (2006-2019)',          2006, 2019, 'petrol', 'manual',    'mpv'),
  ('Toyota', 'Quantum',        '2.5 D-4D (2005-2019)',     2005, 2019, 'diesel', 'manual',    'mpv'),
  ('Toyota', 'Quantum',        '2.7 VVTi (2005-2019)',     2005, 2019, 'petrol', 'manual',    'mpv'),
  -- Ford
  ('Ford', 'Fiesta',           '1.4 (2004-2009)',          2004, 2009, 'petrol', 'manual',    'hatchback'),
  ('Ford', 'Fiesta',           '1.4 (2009-2017)',          2009, 2017, 'petrol', 'manual',    'hatchback'),
  ('Ford', 'Figo',             '1.4 (2010-2015)',          2010, 2015, 'petrol', 'manual',    'hatchback'),
  ('Ford', 'Bantam',           '1.6',                      2002, 2011, 'petrol', 'manual',    'bakkie'),
  ('Ford', 'Ranger',           '2.5 TD (2006-2011)',       2006, 2011, 'diesel', 'manual',    'bakkie'),
  ('Ford', 'Ranger',           '2.2 TDCi (2012-2019)',     2012, 2019, 'diesel', 'manual',    'bakkie'),
  ('Ford', 'Ranger',           '3.2 TDCi (2012-2019)',     2012, 2019, 'diesel', 'manual',    'bakkie'),
  -- Nissan
  ('Nissan', 'Hardbody',       '2.4 (1999-2008)',          1999, 2008, 'petrol', 'manual',    'bakkie'),
  ('Nissan', 'NP300 Hardbody', '2.5 TDi',                  2008, 2021, 'diesel', 'manual',    'bakkie'),
  ('Nissan', 'Tiida',          '1.6',                      2007, 2012, 'petrol', 'manual',    'hatchback'),
  ('Nissan', 'Almera',         '1.5 (2012-2020)',          2012, 2020, 'petrol', 'manual',    'sedan'),
  -- Hyundai / Kia
  ('Hyundai', 'Getz',          '1.4',                      2003, 2011, 'petrol', 'manual',    'hatchback'),
  ('Hyundai', 'i10',           '1.1 (2008-2014)',          2008, 2014, 'petrol', 'manual',    'hatchback'),
  ('Hyundai', 'i20',           '1.4 (2009-2015)',          2009, 2015, 'petrol', 'manual',    'hatchback'),
  ('Hyundai', 'Accent',        '1.6 (2006-2012)',          2006, 2012, 'petrol', 'manual',    'sedan'),
  ('Kia', 'Picanto',           '1.1 (2004-2011)',          2004, 2011, 'petrol', 'manual',    'hatchback'),
  ('Kia', 'Picanto',           '1.2 (2011-2017)',          2011, 2017, 'petrol', 'manual',    'hatchback'),
  ('Kia', 'Rio',               '1.4 (2011-2017)',          2011, 2017, 'petrol', 'manual',    'hatchback'),
  -- Chevrolet / Opel
  ('Chevrolet', 'Spark',       '1.2',                      2010, 2016, 'petrol', 'manual',    'hatchback'),
  ('Chevrolet', 'Aveo',        '1.6',                      2008, 2017, 'petrol', 'manual',    'sedan'),
  ('Chevrolet', 'Utility',     '1.4 (2011-2017)',          2011, 2017, 'petrol', 'manual',    'bakkie'),
  ('Opel', 'Corsa Utility',    '1.4 (2004-2011)',          2004, 2011, 'petrol', 'manual',    'bakkie'),
  ('Opel', 'Corsa',            '1.4 (Corsa D)',            2007, 2015, 'petrol', 'manual',    'hatchback'),
  -- Others
  ('Renault', 'Sandero',       '1.6 (2009-2014)',          2009, 2014, 'petrol', 'manual',    'hatchback'),
  ('Renault', 'Clio',          '1.6 (Clio 3)',             2006, 2012, 'petrol', 'manual',    'hatchback'),
  ('Honda', 'Jazz',            '1.4 (2002-2008)',          2002, 2008, 'petrol', 'manual',    'hatchback'),
  ('Suzuki', 'Swift',          '1.2 (2011-2018)',          2011, 2018, 'petrol', 'manual',    'hatchback'),
  ('Isuzu', 'KB 250',          'D-Teq',                    2004, 2013, 'diesel', 'manual',    'bakkie'),
  ('Isuzu', 'KB 300',          'D-Teq',                    2004, 2013, 'diesel', 'manual',    'bakkie'),
  ('Mazda', 'BT-50',           '2.5 (2007-2011)',          2007, 2011, 'diesel', 'manual',    'bakkie'),
  ('BMW', '3 Series',          '320i (E90)',               2005, 2012, 'petrol', 'automatic', 'sedan'),
  ('BMW', '3 Series',          '320d (E90)',               2005, 2012, 'diesel', 'automatic', 'sedan'),
  ('Mercedes-Benz', 'C-Class', 'C200 (W204)',              2007, 2014, 'petrol', 'automatic', 'sedan'),
  ('Datsun', 'Go',             '1.2',                      2014, 2022, 'petrol', 'manual',    'hatchback')
) AS v(make, model, variant, year_from, year_to, fuel_type, transmission, segment)
WHERE NOT EXISTS (
  SELECT 1 FROM public.vehicles e
  WHERE e.make = v.make AND e.model = v.model AND e.variant = v.variant AND e.created_by IS NULL
);

/*
Check for other SELECT policies on vehicles that would expose private cars:

  SELECT policyname, cmd, roles, qual FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'vehicles';

Only "read_catalogue_and_own_vehicles" (SELECT) and "insert_own_vehicles"
(INSERT) should be listed.
*/
