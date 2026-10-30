import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { REGION_DB_KEY, type PriceRegion } from '@/lib/regions';

/**
 * The user's home price region, saved on their account (auth user_metadata)
 * so it follows them across devices. Defaults to inland (Gauteng).
 */
export function useHomeRegion() {
  const { user } = useAuth();
  const region: PriceRegion = user?.user_metadata?.home_region === 'coastal' ? 'coastal' : 'inland';

  const setRegion = async (next: PriceRegion) => {
    const { error } = await supabase.auth.updateUser({ data: { home_region: next } });
    if (error) throw error;
  };

  return { region, regionKey: REGION_DB_KEY[region], setRegion };
}
