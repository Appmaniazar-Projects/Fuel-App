import { supabase } from '@/lib/supabase';
import * as fillupApi from '@/lib/fillupApi';
import { REGION_DB_KEY, type PriceRegion } from '@/lib/regions';

export type PriceMap = Partial<Record<'unleaded_95' | 'unleaded_93' | 'diesel_50ppm' | 'diesel_500ppm', number>>;

/** Current regulated prices (cents/L) for a region: FillUp API first, then Supabase. */
export async function fetchCurrentPrices(region: PriceRegion): Promise<{ prices: PriceMap; effectiveDate: string | null }> {
  try {
    const api = await fillupApi.getCurrent({ region });
    if (api?.success && api.data?.fuels) {
      const prices: PriceMap = {};
      for (const f of api.data.fuels) {
        if (f.key in { unleaded_95: 1, unleaded_93: 1, diesel_50ppm: 1, diesel_500ppm: 1 }) {
          prices[f.key as keyof PriceMap] = f.price;
        }
      }
      return { prices, effectiveDate: api.data.effective_date ?? null };
    }
  } catch {
    // API not reachable (e.g. on a phone without a hosted API): use the database
  }

  const { data, error } = await supabase
    .from('fuel_prices')
    .select('unleaded_95, unleaded_93, diesel_50ppm, diesel_500ppm, effective_date')
    .eq('region', REGION_DB_KEY[region])
    .eq('is_current', true)
    .order('effective_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return { prices: {}, effectiveDate: null };
  const { effective_date, ...rest } = data;
  const prices: PriceMap = {};
  for (const [k, v] of Object.entries(rest)) if (typeof v === 'number' && v > 0) prices[k as keyof PriceMap] = v;
  return { prices, effectiveDate: effective_date };
}
