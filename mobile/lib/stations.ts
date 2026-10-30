/**
 * Nearby fuel stations from OpenStreetMap (Overpass API). Free, no API key,
 * and covers South African stations with brand tags.
 */

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
  engen: { label: 'Engen', color: '#00A651' },
  shell: { label: 'Shell', color: '#FBCE07' },
  bp: { label: 'BP', color: '#007A33' },
  sasol: { label: 'Sasol', color: '#0033A0' },
  caltex: { label: 'Caltex', color: '#E31837' },
  astron: { label: 'Astron', color: '#00205B' },
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

async function queryOverpass(lat: number, lng: number, radius: number): Promise<OsmElement[]> {
  const query = `[out:json][timeout:20];nwr["amenity"="fuel"](around:${radius},${lat},${lng});out center tags;`;
  let lastError: unknown = null;
  for (const base of OVERPASS_URLS) {
    try {
      const res = await fetch(`${base}?data=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`Station search failed (HTTP ${res.status})`);
      const json = await res.json();
      return json.elements || [];
    } catch (err) {
      lastError = err; // try the next mirror
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Station search failed');
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

/** Stations near a point, nearest first. Widens the search if few are found. */
export async function fetchNearbyStations(lat: number, lng: number): Promise<Station[]> {
  let stations: Station[] = [];
  for (const radius of [5000, 15000]) {
    const elements = await queryOverpass(lat, lng, radius);
    stations = elements
      .map((el) => toStation(el, lat, lng))
      .filter((s): s is Station => s !== null);
    if (stations.length >= 3) break;
  }
  return stations.sort((a, b) => a.distance - b.distance).slice(0, 40);
}
