/*
# Align fuel_prices with what the FillUp API writes

The monthly update job (api/fuel/update-monthly) inserts paraffin_wholesale
and updated_at, and stores Coastal rows which have no 93-octane price.
Earlier versions of this table also used diesel_ultra for 500ppm diesel.

Every step is guarded, so this is safe on a database in any of those states.
*/

DO $$
BEGIN
  -- Rename the old 500ppm column if it is still called diesel_ultra
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fuel_prices' AND column_name = 'diesel_ultra'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fuel_prices' AND column_name = 'diesel_500ppm'
  ) THEN
    ALTER TABLE public.fuel_prices RENAME COLUMN diesel_ultra TO diesel_500ppm;
  END IF;
END $$;

ALTER TABLE public.fuel_prices ADD COLUMN IF NOT EXISTS diesel_500ppm integer;
ALTER TABLE public.fuel_prices ADD COLUMN IF NOT EXISTS paraffin_wholesale integer DEFAULT 0;
ALTER TABLE public.fuel_prices ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Coastal regions don't sell 93 octane
ALTER TABLE public.fuel_prices ALTER COLUMN unleaded_93 DROP NOT NULL;

-- Speeds up the history lookups and the monthly replace-by-month write
CREATE INDEX IF NOT EXISTS fuel_history_month_fuel_key_idx
  ON public.fuel_history (month, fuel_key);
