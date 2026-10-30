import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BRAND_COLORS: { [key: string]: string } = {
  engen: '#00A651',
  bp: '#006F3B',
  shell: '#FBCE07',
  sasol: '#E36F1E',
  caltex: '#0066B3',
  astron: '#1E3A8A',
  total: '#FF0000',
  other: '#6B7280',
};

const BRAND_TAGS = ['engen', 'bp', 'shell', 'sasol', 'caltex', 'astron', 'total'];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const latitude = parseFloat(url.searchParams.get('lat') || '-26.2041');
    const longitude = parseFloat(url.searchParams.get('lng') || '28.0473');
    const radius = parseInt(url.searchParams.get('radius') || '5000');
    const brand = url.searchParams.get('brand');

    if (req.method === 'GET') {
      // For demo purposes, return mock station data
      // In production, integrate with Google Places API
      const mockStations = generateMockStations(latitude, longitude);

      let filteredStations = mockStations;
      if (brand) {
        filteredStations = mockStations.filter(s =>
          s.brand.toLowerCase().includes(brand.toLowerCase())
        );
      }

      // Sort by distance
      const sortedStations = filteredStations.sort((a, b) => a.distance - b.distance);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            stations: sortedStations,
            center: { latitude, longitude },
            radius,
          },
          meta: {
            source: 'demo',
            disclaimer: 'Station data may not reflect real-time availability. Operating hours, prices, and fuel availability are subject to change. Always confirm directly with the station before visiting.',
            googlePlacesIntegration: 'To enable real station data, configure GOOGLE_PLACES_API_KEY in your Supabase project settings.',
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

function generateMockStations(lat: number, lng: number) {
  const brandNames = [
    { name: 'Engen', brand: 'engen' },
    { name: 'BP', brand: 'bp' },
    { name: 'Shell', brand: 'shell' },
    { name: 'Sasol', brand: 'sasol' },
    { name: 'Caltex', brand: 'caltex' },
    { name: 'TotalEnergies', brand: 'total' },
    { name: 'Astron', brand: 'astron' },
  ];

  const streets = ['Main Street', 'Oxford Road', 'Jan Smuts Avenue', 'William Nicol Drive', 'Sandton Drive', 'Rivonia Road', 'Grayston Drive', 'Fredman Drive'];

  return brandNames.map((b, i) => {
    const offsetLat = (Math.random() - 0.5) * 0.02;
    const offsetLng = (Math.random() - 0.5) * 0.02;
    const distance = Math.round(300 + Math.random() * 3000);

    return {
      id: `station-${i}`,
      name: `${b.name} ${streets[i % streets.length].split(' ')[0]}`,
      brand: b.brand,
      latitude: lat + offsetLat,
      longitude: lng + offsetLng,
      address: `${Math.floor(100 + Math.random() * 900)} ${streets[i % streets.length]}, Johannesburg`,
      distance,
      open_now: Math.random() > 0.15,
      rating: +(3.5 + Math.random() * 1.5).toFixed(1),
    };
  });
}
