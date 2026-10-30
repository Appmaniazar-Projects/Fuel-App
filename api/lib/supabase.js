/**
 * lib/supabase.js
 * Supabase client configuration and database operations
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database operations for fuel prices
const FuelPriceDB = {
  // Get current fuel prices for a region. Region values are the
  // DB-canonical keys ('Gauteng Inland', 'Western Cape Coastal', 'KZN
  // Coastal') stored in fuel_prices.region — the same strings the
  // FuelWise app's direct-Supabase fallback filters on. Not the
  // parenthesised display label (e.g. "Gauteng (Inland)") used in API JSON.
  async getCurrentPrices(region = 'Gauteng Inland') {
    const { data, error } = await supabase
      .from('fuel_prices')
      .select('*')
      .eq('region', region)
      .eq('is_current', true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  },

  // Get historical fuel prices
  async getHistoricalPrices(fuelKey = null, fromDate = null, toDate = null) {
    let query = supabase
      .from('fuel_history')
      .select('*')
      .order('month', { ascending: true });

    if (fuelKey) {
      query = query.eq('fuel_key', fuelKey);
    }

    if (fromDate) {
      query = query.gte('month', fromDate);
    }

    if (toDate) {
      query = query.lte('month', toDate);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  },

  // Insert new current fuel prices for a region, retiring the previous
  // current row for that region. `prices` is a flat object of fuel_key ->
  // price_cents matching the fuel_prices columns (unleaded_93, unleaded_95,
  // diesel_50ppm, diesel_500ppm, paraffin_retail, paraffin_wholesale, lpg).
  async upsertCurrentPrices(region, prices, source) {
    const { error: clearError } = await supabase
      .from('fuel_prices')
      .update({ is_current: false })
      .eq('region', region)
      .eq('is_current', true);

    if (clearError) {
      throw clearError;
    }

    const { data, error } = await supabase
      .from('fuel_prices')
      .insert({
        region,
        ...prices,
        effective_date: new Date().toISOString().slice(0, 10),
        data_source: source,
        is_current: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Add historical data
  async addHistoricalData(records) {
    const { data, error } = await supabase
      .from('fuel_history')
      .insert(records)
      .select();

    if (error) {
      throw error;
    }

    return data;
  },

  // Get macro economic data
  async getMacroData() {
    const { data, error } = await supabase
      .from('macro_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  },

  // Update macro data
  async updateMacroData(brentCrude, zarUsdRate) {
    const { data, error } = await supabase
      .from('macro_data')
      .upsert({
        brent_crude_usd: brentCrude,
        zar_usd_rate: zarUsdRate,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
};

module.exports = { supabase, FuelPriceDB };
