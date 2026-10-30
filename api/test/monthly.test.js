const path = require('path'); const assert = require('assert');
const API = path.join(__dirname, '..');
const calls = [];
const dbPath = require.resolve(path.join(API, 'lib/supabase'));
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { FuelPriceDB: {
  upsertCurrentPrices: async (...a) => { calls.push(['current', ...a]); return { id: 'row' }; },
  replaceHistoryForMonth: async (m, rows) => { calls.push(['history', m, rows.map(r => r.fuel_key)]); return rows; },
}}};
process.env.CRON_SECRET = 'cronsecret';
const handler = require(path.join(API, 'api/fuel/update-monthly'));
function res() { const r = { headers: {}, setHeader(k, v) { r.headers[k] = v; }, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; }, end() { return r; } }; return r; }
(async () => {
  const noAuth = await handler({ method: 'GET', headers: {}, query: {} }, res());
  assert.strictEqual(noAuth.code, 401);
  const wrong = await handler({ method: 'GET', headers: { authorization: 'Bearer nope' }, query: {} }, res());
  assert.strictEqual(wrong.code, 401);
  // No network in tests, so the scrape falls back: nothing may be written.
  const cron = await handler({ method: 'GET', headers: { authorization: 'Bearer cronsecret' }, query: {} }, res());
  assert.strictEqual(cron.code, 502);
  assert.strictEqual(calls.length, 0, 'fallback prices must never be saved');

  // Live scrape succeeds: every month on the page is written as 'YYYY-MM'.
  const scraperPath = require.resolve(path.join(API, 'lib/scraper'));
  const scraper = require(scraperPath);
  scraper.fetchMonthlyPrices = async (region) => ({
    effective_date: '2026-10-07', region: region === 'coastal' ? 'Western Cape Coastal' : 'Gauteng Inland',
    source: 'fuelsindustry.org.za', prices: { unleaded_95: 3025, leaded_93: 2988 },
    series: { unleaded_95: [{ month: '2026-09', cents: 2692 }, { month: '2026-10', cents: 3025 }], leaded_93: [{ month: '2026-10', cents: 2988 }] },
  });
  delete require.cache[require.resolve(path.join(API, 'api/fuel/update-monthly'))];
  const handler2 = require(path.join(API, 'api/fuel/update-monthly'));
  calls.length = 0;
  const live = await handler2({ method: 'GET', headers: { authorization: 'Bearer cronsecret' }, query: {} }, res());
  assert.strictEqual(live.code, 200);
  const hist = calls.filter(c => c[0] === 'history');
  assert.deepStrictEqual(hist.map(c => c[1]), ['2026-09', '2026-10']);
  assert.ok(hist.every(c => !c[2].includes('leaded_93')), 'leaded_93 is not in fuel_types');
  assert.deepStrictEqual(live.body.data.results[0].history_months, ['2026-09', '2026-10']);
  console.log('monthly update: ALL PASS');
})();
