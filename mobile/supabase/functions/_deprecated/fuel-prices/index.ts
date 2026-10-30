import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const region = url.searchParams.get('region');
    const includeHistory = url.searchParams.get('history') === 'true';

    if (req.method === 'GET') {
      // Get current fuel prices
      let query = supabase
        .from('fuel_prices')
        .select('*')
        .eq('is_current', true);

      if (region) {
        query = query.eq('region', region);
      }

      const { data: prices, error } = await query;

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch fuel prices' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let history = null;
      if (includeHistory) {
        const { data: historyData } = await supabase
          .from('fuel_history')
          .select('*')
          .order('month', { ascending: false })
          .limit(24);
        history = historyData;
      }

      // Get available regions
      const { data: regions } = await supabase
        .from('fuel_prices')
        .select('region')
        .eq('is_current', true);

      const uniqueRegions = [...new Set(regions?.map(r => r.region) || [])];

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            prices: region && prices ? prices[0] : prices,
            regions: uniqueRegions,
            history,
          },
          meta: {
            source: 'DMRE',
            updated: new Date().toISOString(),
            disclaimer: 'Official fuel prices from the South African Department of Mineral Resources and Energy (DMRE). Prices are updated monthly.',
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
