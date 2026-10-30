import { BRANDS, type Station } from '@/lib/stations';

export interface MapPrice {
  label: string;
  price: string; // formatted, e.g. "R30.25"
}

// Lucide "fuel" icon (ISC licence), drawn inside each marker.
const FUEL_ICON = (stroke: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="15" y1="22" y2="22"/><line x1="4" x2="14" y1="9" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>`;

// Dark icon on light brand colours (e.g. Shell yellow), white otherwise.
function iconColourFor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170 ? '#1F2937' : '#FFFFFF';
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

/** A self-contained Leaflet page showing the user and nearby stations. */
export function buildStationsMapHtml(opts: {
  user: { latitude: number; longitude: number };
  stations: Station[];
  prices: MapPrice[];
  dark: boolean;
}): string {
  const markers = opts.stations.map((s) => {
    const colour = BRANDS[s.brand]?.color ?? BRANDS.other.color;
    const priceRows = opts.prices
      .map((p) => `<tr><td>${esc(p.label)}</td><td style="text-align:right;font-weight:600">${esc(p.price)}</td></tr>`)
      .join('');
    const km = s.distance < 1000 ? `${s.distance} m` : `${(s.distance / 1000).toFixed(1)} km`;
    const directions = `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`;
    return {
      lat: s.latitude,
      lng: s.longitude,
      colour,
      icon: FUEL_ICON(iconColourFor(colour)),
      popup:
        `<div style="min-width:180px"><div style="font-weight:700;font-size:14px">${esc(s.name)}</div>` +
        `<div style="color:#6B7280;margin:2px 0 6px">${esc(s.brandLabel)} · ${km}</div>` +
        (priceRows ? `<table style="width:100%;font-size:13px">${priceRows}</table>` : '') +
        `<a href="${directions}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px">Directions</a></div>`,
    };
  });

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{margin:0;height:100%;background:${opts.dark ? '#111827' : '#F3F4F6'}}
  .pin{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;
       border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)}
  .me{width:16px;height:16px;border-radius:50%;background:#2563EB;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.25)}
</style></head><body><div id="map"></div><script>
  var map = L.map('map', { zoomControl: true }).setView([${opts.user.latitude}, ${opts.user.longitude}], 14);
  // CARTO basemap tiles. tile.openstreetmap.org refuses requests without a
  // Referer (403 "Access blocked"), which is what an embedded map sends.
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/${opts.dark ? 'dark_all' : 'voyager'}/{z}/{x}/{y}{r}.png', {
    maxZoom: 19, subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);
  L.marker([${opts.user.latitude}, ${opts.user.longitude}], {
    icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [16, 16] }), title: 'You'
  }).addTo(map);
  var markers = ${JSON.stringify(markers)};
  var bounds = [[${opts.user.latitude}, ${opts.user.longitude}]];
  markers.forEach(function (m) {
    var icon = L.divIcon({ className: '', iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16],
      html: '<div class="pin" style="background:' + m.colour + '">' + m.icon + '</div>' });
    L.marker([m.lat, m.lng], { icon: icon }).addTo(map).bindPopup(m.popup);
    bounds.push([m.lat, m.lng]);
  });
  if (markers.length) map.fitBounds(bounds.slice(0, 13), { padding: [30, 30], maxZoom: 15 });
</script></body></html>`;
}
