// Type declarations for the database types
export interface User {
    id: string;
    email: string;
    created_at: string;
    updated_at: string;
}

export interface Session {
    user: User;
    access_token: string;
    refresh_token: string;
    expires_at: number;
}

export interface FuelPrice {
  id: string;
  effective_date: string;
  next_revision: string | null;
  region: string;
  currency: string;
  unit: string;
  unleaded_93: number;
  unleaded_95: number;
  leaded_93: number | null;
  leaded_95: number | null;
  diesel_low_sulphur: number;
  diesel_ultra: number;
  paraffin_retail: number | null;
  paraffin_wholesale: number | null;
  lpg: number | null;
  data_source: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface FuelHistory {
  id: string;
  month: string;
  fuel_key: string;
  price_cents: number;
  price_rands: number;
  created_at: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  transmission: 'manual' | 'automatic';
  official_km_per_l: number | null;
  variant?: string | null;
  fuel_type?: 'diesel' | 'petrol' | null;
  year_from?: number | null;
  year_to?: number | null;
}

export interface UserVehicleWithVehicle {
  id: string;
  user_id: string;
  vehicle_id: string;
  nickname: string;
  is_default: boolean;
  selected_fuel_key?: string | null;
  vehicle: Vehicle;
}

export interface FillUp {
  id: string;
  user_id: string;
  user_vehicle_id: string;
  logged_at: string;
  odometer_km: number | null;
  litres: number;
  cost: number;
  price_cents_per_litre?: number | null;
  station_name?: string | null;
}

// Additional DB table types from schema
export interface FuelType {
  id: string;
  key: string;
  label: string;
  type: string;
  grade: string;
  created_at?: string;
}

export interface MacroData {
  id: string;
  brent_crude_usd?: number | null;
  zar_usd_rate?: number | null;
  created_at?: string;
}

export interface ApiUsage {
  id: string;
  endpoint: string;
  api_key_hash?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string;
}
