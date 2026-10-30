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
  console.log('monthly update: ALL PASS');
})();
