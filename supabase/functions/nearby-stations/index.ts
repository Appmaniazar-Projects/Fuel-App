import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Station {
  id: string;
  name: string;
  brand: string;
  latitude: number;
  longitude: number;
  address: string;
  distance: number;
  open_now: boolean | null;
  rating: number | null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function inferBrand(name: string): string {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('engen')) return 'engen';
  if (nameLower.includes('bp')) return 'bp';
  if (nameLower.includes('shell')) return 'shell';
  if (nameLower.includes('sasol')) return 'sasol';
  if (nameLower.includes('caltex')) return 'caltex';
  if (nameLower.includes('astron')) return 'astron';
  if (nameLower.includes('total') || nameLower.includes('totalenergies')) return 'total';
  return 'other';
}

async function getPhotoUrl(photoReference: string, apiKey: string): Promise<string | null> {
  return `https://places.googleapis.com/v1/${photoReference}/media?maxHeightPx=400&key=${apiKey}`;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

    if (!apiKey) {
      console.error("Google Places API key not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body or query params
    let body;
    if (req.method === "POST") {
      body = await req.json();
    } else {
      const url = new URL(req.url);
      body = {
        latitude: parseFloat(url.searchParams.get("latitude") || "0"),
        longitude: parseFloat(url.searchParams.get("longitude") || "0"),
        radius: parseInt(url.searchParams.get("radius") || "5000"),
      };
    }

    const { latitude, longitude, radius = 5000 } = body;

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "Latitude and longitude required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Google Places API (New) - Nearby Search
    const placesUrl = new URL("https://places.googleapis.com/v1/places:searchNearby");

    const requestBody = {
      includedTypes: ["gas_station"],
      maxResultCount: 20,
      locationRestriction: {
        center: {
          latitude,
          longitude,
        },
        radius,
      },
    };

    const response = await fetch(placesUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.formattedAddress,places.currentOpeningHours,places.rating",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Places API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch from Google Places" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const places = data.places || [];

    // Transform to our station format
    const stations: Station[] = places.map((place: any) => {
      const lat = place.location?.latitude || 0;
      const lng = place.location?.longitude || 0;
      const distance = calculateDistance(latitude, longitude, lat, lng);

      return {
        id: place.id || `place-${Math.random().toString(36).substr(2, 9)}`,
        name: place.displayName?.text || "Unknown Station",
        brand: inferBrand(place.displayName?.text || ""),
        latitude: lat,
        longitude: lng,
        address: place.formattedAddress || "",
        distance: Math.round(distance),
        open_now: place.currentOpeningHours?.openNow ?? null,
        rating: place.rating ?? null,
      };
    });

    // Sort by distance
    stations.sort((a, b) => a.distance - b.distance);

    return new Response(
      JSON.stringify({ stations }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in nearby-stations function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
