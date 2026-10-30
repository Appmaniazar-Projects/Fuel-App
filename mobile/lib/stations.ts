/**
 * Nearby fuel stations. Read from the fuel_stations table in Supabase (a
 * copy of OpenStreetMap's SA stations imported by the FillUp API), which is
 * fast. Falls back to querying OpenStreetMap's Overpass API live if the
 * table is empty or unreachable; that's free but often slow.
 */
import { supabase } from '@/lib/supabase';

export interface Station {
  id: string;
  name: string;
  brand: string; // normalised brand key, e.g. 'engen' or 'other'
  brandLabel: string; // display name, e.g. 'Engen'
  latitude: number;
  longitude: number;
  address: string;
  distance: number; // metres from the user
  open24h: boolean;
}

export const BRANDS: Record<string, { label: string; color: string }> = {
  engen: { label: 'Engen', color: '#0067B1' },
  shell: { label: 'Shell', color: '#FBCE07' },
  bp: { label: 'BP', color: '#007A33' },
  sasol: { label: 'Sasol', color: '#0033A0' },
  caltex: { label: 'Caltex', color: '#E31837' },
  astron: { label: 'Astron', color: '#F47920' },
  total: { label: 'TotalEnergies', color: '#ED0000' },
  puma: { label: 'Puma', color: '#E2001A' },
  other: { label: 'Other', color: '#6B7280' },
};

export function brandKey(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('engen')) return 'engen';
  if (t.includes('shell')) return 'shell';
  if (/\bbp\b/.test(t)) return 'bp';
  if (t.includes('sasol')) return 'sasol';
  if (t.includes('caltex')) return 'caltex';
  if (t.includes('astron')) return 'astron';
  if (t.includes('total')) return 'total';
  if (t.includes('puma')) return 'puma';
  return 'other';
}

export function distanceMetres(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

interface OsmElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// Resolves with the first promise that succeeds (Promise.any isn't
// available on every React Native JS engine).
function firstSuccess<T>(promises: Promise<T>[]): Promise<T> {
  return new Promise((resolve, reject) => {
    let failed = 0;
    promises.forEach((p) =>
      p.then(resolve, () => {
        failed += 1;
        if (failed === promises.length) reject(new Error('all failed'));
      })
    );
  });
}

// Ask every mirror at once and use whichever answers first; give up on a
// mirror after 8 seconds so a slow one can't hold the screen up.
async function queryOverpass(lat: number, lng: number, radius: number): Promise<OsmElement[]> {
  const query = `[out:json][timeout:10];nwr["amenity"="fuel"](around:${radius},${lat},${lng});out center tags;`;
  const controllers = OVERPASS_URLS.map(() => new AbortController());
  const attempts = OVERPASS_URLS.map(async (base, i) => {
    const timer = setTimeout(() => controllers[i].abort(), 8000);
    try {
      const res = await fetch(`${base}?data=${encodeURIComponent(query)}`, { signal: controllers[i].signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return (json.elements || []) as OsmElement[];
    } finally {
      clearTimeout(timer);
    }
  });
  try {
    const elements = await firstSuccess(attempts);
    controllers.forEach((c) => c.abort()); // cancel the slower mirror
    return elements;
  } catch {
    throw new Error('Station search timed out. Pull down to try again.');
  }
}

function toStation(el: OsmElement, lat: number, lng: number): Station | null {
  const pos = el.center ?? (el.lat != null && el.lon != null ? { lat: el.lat, lon: el.lon } : null);
  if (!pos) return null;
  const tags = el.tags || {};
  const key = brandKey(`${tags.brand || ''} ${tags.operator || ''} ${tags.name || ''}`);
  const brandLabel = key === 'other' ? tags.brand || 'Independent' : BRANDS[key].label;
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const area = tags['addr:suburb'] || tags['addr:city'] || '';
  return {
    id: `${el.type}-${el.id}`,
    name: tags.name || `${brandLabel} station`,
    brand: key,
    brandLabel,
    latitude: pos.lat,
    longitude: pos.lon,
    address: [street, area].filter(Boolean).join(', '),
    distance: distanceMetres(lat, lng, pos.lat, pos.lon),
    open24h: tags.opening_hours === '24/7',
  };
}

interface StationRow {
  id: string;
  name: string;
  brand: string;
  brand_label: string;
  latitude: number;
  longitude: number;
  address: string | null;
  open_24h: boolean;
}

// Bounding-box query on the imported table, widening once if needed.
async function fromDatabase(lat: number, lng: number): Promise<Station[]> {
  for (const radius of [8000, 20000]) {
    const dLat = radius / 111320;
    const dLng = radius / (111320 * Math.cos((lat * Math.PI) / 180));
    const { data, error } = await supabase
      .from('fuel_stations')
      .select('id, name, brand, brand_label, latitude, longitude, address, open_24h')
      .gte('latitude', lat - dLat)
      .lte('latitude', lat + dLat)
      .gte('longitude', lng - dLng)
      .lte('longitude', lng + dLng)
      .limit(300);
    if (error) throw error;
    const stations = ((data || []) as StationRow[])
      .map((r) => ({
        id: r.id,
        name: r.name,
        brand: r.brand in BRANDS ? r.brand : 'other',
        brandLabel: r.brand_label,
        latitude: r.latitude,
        longitude: r.longitude,
        address: r.address || '',
        distance: distanceMetres(lat, lng, r.latitude, r.longitude),
        open24h: r.open_24h,
      }))
      .filter((s) => s.distance <= radius);
    if (stations.length >= 3) return stations;
  }
  return [];
}

// Results are cached for 10 minutes per ~100 m area, so switching tabs and
// coming back is instant.
const cache = new Map<string, { at: number; stations: Station[] }>();
const CACHE_MS = 10 * 60 * 1000;

/** Stations near a point, nearest first. Widens the search if few are found. */
export async function fetchNearbyStations(lat: number, lng: number, opts?: { force?: boolean }): Promise<Station[]> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const hit = cache.get(cacheKey);
  if (!opts?.force && hit && Date.now() - hit.at < CACHE_MS) return hit.stations;

  let stations: Station[] = [];
  try {
    stations = await fromDatabase(lat, lng);
  } catch {
    stations = []; // table missing or offline: use the live search
  }
  for (const radius of stations.length >= 3 ? [] : [8000, 20000]) {
    const elements = await queryOverpass(lat, lng, radius);
    stations = elements
      .map((el) => toStation(el, lat, lng))
      .filter((s): s is Station => s !== null);
    if (stations.length >= 3) break;
  }
  stations = stations.sort((a, b) => a.distance - b.distance).slice(0, 40);
  cache.set(cacheKey, { at: Date.now(), stations });
  return stations;
}
