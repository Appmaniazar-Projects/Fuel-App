const BASE_URL =
  process.env.EXPO_PUBLIC_FILLUP_API_URL || process.env.NEXT_PUBLIC_FILLUP_API_URL || 'http://localhost:3001/api';

const API_KEY = process.env.EXPO_PUBLIC_FILLUP_API_KEY || process.env.NEXT_PUBLIC_FILLUP_API_KEY || '';

function buildUrl(path: string, params?: Record<string, any>) {
  const url = new URL(path, BASE_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
    });
  }
  return url.toString();
}

async function apiGet(path: string, params?: Record<string, any>) {
  const url = buildUrl(path, params);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['X-FillUp-Key'] = API_KEY;

  const res = await fetch(url, { method: 'GET', headers });
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const err = (json && (json.error || json.message)) || `HTTP ${res.status}`;
    throw new Error(String(err));
  }

  return json;
}

export async function getCurrent(options?: { type?: string; region?: string; format?: string }) {
  return apiGet('/fuel/current', options as any);
}

export async function getKeys() {
  return apiGet('/fuel/keys');
}

export async function getPrice(key: string) {
  return apiGet('/fuel/price', { key });
}

export async function getHistory(params?: { from?: string; to?: string; fuel_key?: string }) {
  return apiGet('/fuel/history', params as any);
}

export default { getCurrent, getKeys, getPrice, getHistory };
