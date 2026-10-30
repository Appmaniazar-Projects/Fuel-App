/*
# FuelWise Database Schema

## Overview
This migration creates the complete database schema for FuelWise, a South African fuel companion app.

## New Tables

### 1. fuel_prices
Stores current and historical fuel prices by region and effective date.
- id: UUID primary key
- effective_date: Date when these prices became effective
- region: South African region (Gauteng Inland, Western Cape Coastal, KZN Coastal)
- unleaded_93, unleaded_95: Petrol prices in cents per litre
- leaded_93, leaded_95: Leaded petrol prices in cents per litre (legacy)
-diesel_50ppm: Diesel 50ppm (0.05% sulphur) in cents per litre
- diesel_500ppm: Diesel 500ppm (0.005% sulphur) in cents per litre
- paraffin_retail: Illuminating paraffin in cents per litre
- lpg: Liquefied petroleum gas in cents per litre
- is_current: Boolean flag marking the current active price set
- data_source: Source of price data (DMRE, FIASA, gazette)

### 2. fuel_history
Historical monthly fuel prices for trend analysis.
- id: UUID primary key
- month: First day of the month
- fuel_key: Fuel type identifier (unleaded_93, unleaded_95, diesel_50ppm, diesel_500ppm)
- price_cents: Price in cents per litre

### 3. vehicles
Reference table of vehicle specifications with official fuel consumption.
- id: UUID primary key
- make: Manufacturer name (Toyota, VW, Ford, etc.)
- model: Model name (Hilux, Polo, Ranger, etc.)
- variant: Specific variant description
- year_from, year_to: Model year range
- engine_cc: Engine displacement in cubic centimetres
- fuel_type: petrol or diesel
- transmission: manual or automatic
- doors: Number of doors
- official_l_per_100km: Official consumption in litres per 100km
- official_km_per_l: Official consumption in km per litre (calculated)
- segment: Vehicle segment (hatchback, sedan, suv, bakkie, etc.)

### 4. user_vehicles
User's saved vehicles linked to the vehicles reference table.
- id: UUID primary key
- user_id: Owner's user ID (defaults to auth.uid())
- vehicle_id: Foreign key to vehicles table
- nickname: User's custom name for the vehicle
- selected_fuel_key: Preferred fuel type
- is_default: Whether this is the user's default vehicle

### 5. fill_ups
Individual fill-up records for user's vehicles.
- id: UUID primary key
- user_id: Owner's user ID (defaults to auth.uid())
- user_vehicle_id: Foreign key to user_vehicles
- logged_at: Timestamp of the fill-up
- litres: Volume of fuel pumped
- odometer_km: Odometer reading in kilometres
- fuel_key: Type of fuel purchased
- price_cents_per_litre: Price paid per litre in cents
- station_name: Optional station name
- notes: Optional user notes

## Security
- RLS enabled on all tables
- fuel_prices, fuel_history, vehicles: Public read access (anon + authenticated)
- user_vehicles, fill_ups: Owner-scoped CRUD (authenticated only, auth.uid() = user_id)

## Indexes
- fuel_prices: (effective_date, region, is_current)
- fuel_history: (month, fuel_key)
- vehicles: (make, model)
- user_vehicles: (user_id, is_default)
- fill_ups: (user_id, user_vehicle_id, logged_at DESC)
*/

-- Create fuel_prices table
CREATE TABLE IF NOT EXISTS fuel_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_date date NOT NULL,
  region text NOT NULL,
  unleaded_93 integer NOT NULL,
  unleaded_95 integer NOT NULL,
  leaded_93 integer DEFAULT 0,
  leaded_95 integer DEFAULT 0,
 diesel_50ppm integer NOT NULL,
diesel_500ppm integer NOT NULL,
  paraffin_retail integer DEFAULT 0,
  lpg integer DEFAULT 0,
  is_current boolean NOT NULL DEFAULT false,
  data_source text NOT NULL DEFAULT 'DMRE',
  created_at timestamptz DEFAULT now()
);

-- Create fuel_history table
CREATE TABLE IF NOT EXISTS fuel_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL,
  fuel_key text NOT NULL,
  price_cents integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text NOT NULL,
  variant text,
  year_from integer,
  year_to integer,
  engine_cc integer,
  fuel_type text NOT NULL CHECK (fuel_type IN ('petrol', 'diesel')),
  transmission text NOT NULL CHECK (transmission IN ('manual', 'automatic')),
  doors integer,
  official_l_per_100km numeric(5,2),
  official_km_per_l numeric(5,2),
  segment text,
  created_at timestamptz DEFAULT now()
);

-- Create user_vehicles table
CREATE TABLE IF NOT EXISTS user_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  selected_fuel_key text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fill_ups table
CREATE TABLE IF NOT EXISTS fill_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  user_vehicle_id uuid NOT NULL REFERENCES user_vehicles(id) ON DELETE CASCADE,
  logged_at timestamptz NOT NULL DEFAULT now(),
  litres numeric(6,2) NOT NULL,
  odometer_km integer,
  fuel_key text NOT NULL,
  price_cents_per_litre integer NOT NULL,
  station_name text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE fuel_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fill_ups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fuel_prices (public read)
DROP POLICY IF EXISTS "anon_read_fuel_prices" ON fuel_prices;
CREATE POLICY "anon_read_fuel_prices" ON fuel_prices FOR SELECT
  TO anon, authenticated USING (true);

-- RLS Policies for fuel_history (public read)
DROP POLICY IF EXISTS "anon_read_fuel_history" ON fuel_history;
CREATE POLICY "anon_read_fuel_history" ON fuel_history FOR SELECT
  TO anon, authenticated USING (true);

-- RLS Policies for vehicles (public read)
DROP POLICY IF EXISTS "anon_read_vehicles" ON vehicles;
CREATE POLICY "anon_read_vehicles" ON vehicles FOR SELECT
  TO anon, authenticated USING (true);

-- RLS Policies for user_vehicles (owner-scoped CRUD)
DROP POLICY IF EXISTS "select_own_user_vehicles" ON user_vehicles;
CREATE POLICY "select_own_user_vehicles" ON user_vehicles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_vehicles" ON user_vehicles;
CREATE POLICY "insert_own_user_vehicles" ON user_vehicles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_vehicles" ON user_vehicles;
CREATE POLICY "update_own_user_vehicles" ON user_vehicles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_vehicles" ON user_vehicles;
CREATE POLICY "delete_own_user_vehicles" ON user_vehicles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for fill_ups (owner-scoped CRUD)
DROP POLICY IF EXISTS "select_own_fill_ups" ON fill_ups;
CREATE POLICY "select_own_fill_ups" ON fill_ups FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_fill_ups" ON fill_ups;
CREATE POLICY "insert_own_fill_ups" ON fill_ups FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_fill_ups" ON fill_ups;
CREATE POLICY "update_own_fill_ups" ON fill_ups FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_fill_ups" ON fill_ups;
CREATE POLICY "delete_own_fill_ups" ON fill_ups FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fuel_prices_lookup ON fuel_prices(effective_date, region, is_current);
CREATE INDEX IF NOT EXISTS idx_fuel_history_lookup ON fuel_history(month, fuel_key);
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX IF NOT EXISTS idx_user_vehicles_user ON user_vehicles(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_fill_ups_user_vehicle ON fill_ups(user_id, user_vehicle_id, logged_at DESC);