/*
# fuel_stations: local copy of South African fuel stations

Imported from OpenStreetMap by the FillUp API (GET /api/stations/import),
so the app can find nearby stations with a fast database query instead of
waiting on the public Overpass service, which is often slow.

Public read; only the API (service role) writes.
*/

CREATE TABLE IF NOT EXISTS public.fuel_stations (
  id text PRIMARY KEY,               -- OpenStreetMap id, e.g. 'node-123'
  name text NOT NULL,
  brand text NOT NULL,               -- normalised key: engen, shell, bp, ...
  brand_label text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text,
  open_24h boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fuel_stations_lat_lng_idx ON public.fuel_stations (latitude, longitude);

ALTER TABLE public.fuel_stations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_fuel_stations" ON public.fuel_stations;
CREATE POLICY "read_fuel_stations" ON public.fuel_stations FOR SELECT
  TO anon, authenticated USING (true);
