export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      fuel_prices: {
        Row: {
          id: string;
          effective_date: string;
          region: string;
          unleaded_93: number;
          unleaded_95: number;
          leaded_93: number;
          leaded_95: number;
          diesel_low_sulphur: number;
          diesel_ultra: number;
          paraffin_retail: number;
          lpg: number;
          is_current: boolean;
          data_source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          effective_date: string;
          region: string;
          unleaded_93: number;
          unleaded_95: number;
          leaded_93?: number;
          leaded_95?: number;
          diesel_low_sulphur: number;
          diesel_ultra: number;
          paraffin_retail?: number;
          lpg?: number;
          is_current?: boolean;
          data_source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          effective_date?: string;
          region?: string;
          unleaded_93?: number;
          unleaded_95?: number;
          leaded_93?: number;
          leaded_95?: number;
          diesel_low_sulphur?: number;
          diesel_ultra?: number;
          paraffin_retail?: number;
          lpg?: number;
          is_current?: boolean;
          data_source?: string;
          created_at?: string;
        };
      };
      fuel_history: {
        Row: {
          id: string;
          month: string;
          fuel_key: string;
          price_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          month: string;
          fuel_key: string;
          price_cents: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          month?: string;
          fuel_key?: string;
          price_cents?: number;
          created_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          make: string;
          model: string;
          variant: string | null;
          year_from: number | null;
          year_to: number | null;
          engine_cc: number | null;
          fuel_type: 'petrol' | 'diesel';
          transmission: 'manual' | 'automatic';
          doors: number | null;
          official_l_per_100km: number | null;
          official_km_per_l: number | null;
          segment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          make: string;
          model: string;
          variant?: string | null;
          year_from?: number | null;
          year_to?: number | null;
          engine_cc?: number | null;
          fuel_type: 'petrol' | 'diesel';
          transmission: 'manual' | 'automatic';
          doors?: number | null;
          official_l_per_100km?: number | null;
          official_km_per_l?: number | null;
          segment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          make?: string;
          model?: string;
          variant?: string | null;
          year_from?: number | null;
          year_to?: number | null;
          engine_cc?: number | null;
          fuel_type?: 'petrol' | 'diesel';
          transmission?: 'manual' | 'automatic';
          doors?: number | null;
          official_l_per_100km?: number | null;
          official_km_per_l?: number | null;
          segment?: string | null;
          created_at?: string;
        };
      };
      user_vehicles: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string;
          nickname: string;
          selected_fuel_key: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          vehicle_id: string;
          nickname: string;
          selected_fuel_key?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vehicle_id?: string;
          nickname?: string;
          selected_fuel_key?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      fill_ups: {
        Row: {
          id: string;
          user_id: string;
          user_vehicle_id: string;
          logged_at: string;
          litres: number;
          odometer_km: number | null;
          fuel_key: string;
          price_cents_per_litre: number;
          station_name: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          user_vehicle_id: string;
          logged_at?: string;
          litres: number;
          odometer_km?: number | null;
          fuel_key: string;
          price_cents_per_litre: number;
          station_name?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_vehicle_id?: string;
          logged_at?: string;
          litres?: number;
          odometer_km?: number | null;
          fuel_key?: string;
          price_cents_per_litre?: number;
          station_name?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type FuelPrice = Database['public']['Tables']['fuel_prices']['Row'];
export type FuelHistory = Database['public']['Tables']['fuel_history']['Row'];
export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type UserVehicle = Database['public']['Tables']['user_vehicles']['Row'];
export type FillUp = Database['public']['Tables']['fill_ups']['Row'];

export type UserVehicleWithVehicle = UserVehicle & {
  vehicle: Vehicle;
};

export type FillUpWithVehicle = FillUp & {
  user_vehicle: UserVehicleWithVehicle;
};
