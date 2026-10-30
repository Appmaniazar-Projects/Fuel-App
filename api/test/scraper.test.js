const path = require('path'); const assert = require('assert');
const API = path.join(__dirname, '..');
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function table(rows, headerFn) {
  const head = '<tr><th>Products</th>' + months.map((m,i)=>`<th>${headerFn(m,i)}</th>`).join('') + '</tr>';
  return '<table>' + head + rows.map(([label, vals]) => '<tr><td>'+label+'</td>' + months.map((_,i)=>`<td>${vals[i]??''}</td>`).join('') + '</tr>').join('') + '</table>';
}
const g = [['93 ULP', ['2500,00','2600,00','2700,00','2795,00','2594,00','2620,00','2680,00','2650,00','2610,00','2701,00']],
           ['95 ULP', ['2500,00','2600,00','2700,00','2663,00','2610,00','2630,00','2690,00','2660,00','2620,00','2712,00']],
           ['Diesel 0.05%', ['2400,00','2500,00','2600,00','2793,00','2479,00','2500,00','2550,00','2520,00','2490,00','2580,00']],
           ['Diesel 0.005%', ['2400,00','2500,00','2600,00','2876,00','2517,00','2540,00','2590,00','2560,00','2530,00','2620,00']],
           ['Illuminating Paraffin', ['1700,00','','','','','','','','','1750,00']]];
const c = [['95 ULP', ['2500,00','2600,00','2700,00','2719,00','2523,00','2540,00','2600,00','2570,00','2530,00','2625,00']],
           ['95 LRP', ['2500,00','2600,00','2700,00','2719,00','2523,00','2540,00','2600,00','2570,00','2530,00','2625,00']],
           ['Diesel 0.05%', ['2400,00','2500,00','2600,00','2705,00','2392,00','2410,00','2460,00','2430,00','2400,00','2490,00']],
           ['Diesel 0.005%', ['2400,00','2500,00','2600,00','2789,00','2430,00','2450,00','2500,00','2470,00','2440,00','2530,00']]];
const { parseFiasaTables, parseColumnDate } = require(path.join(API, 'lib/scraper'));

// Header style A: "7-Oct-26" style dates
let html = table(c, (m,i)=>`${i+1}-${m}-26`) + table(g, (m,i)=>`${i+1}-${m}-26`);
let r = parseFiasaTables(html);
assert.strictEqual(r.gauteng.prices.unleaded_95, 2712);
assert.strictEqual(r.gauteng.prevPrices.unleaded_95, 2620);
assert.strictEqual(r.coastal.prices.diesel_500ppm, 2530);
assert.strictEqual(r.coastal.prevPrices.diesel_500ppm, 2440);
assert.strictEqual(r.gauteng.prevPrices.paraffin_wholesale, 1700, 'skips blank months to find previous');
assert.strictEqual(r.gauteng.effectiveDate, '2026-10-10');
console.log('dated headers:', r.gauteng.effectiveDate, r.gauteng.prices, r.gauteng.prevPrices);

// Header style B: bare month names -> first Wednesday of that month
r = parseFiasaTables(table(g, m=>m));
assert.strictEqual(r.gauteng.effectiveDate, parseColumnDate('Oct', 10));
console.log('month-only headers:', r.gauteng.effectiveDate);

assert.strictEqual(parseColumnDate('', 10, new Date('2026-10-30')), '2026-10-07');
assert.strictEqual(parseColumnDate('Jul 2026', 7), '2026-07-01');
assert.strictEqual(parseColumnDate('1-Jul-26', 7), '2026-07-01');

// End to end: getLatestPrices with axios returning that HTML
const axios = require(require.resolve('axios', { paths: [path.join(API, 'lib')] }));
axios.get = async () => ({ data: html });
const { getLatestPrices } = require(path.join(API, 'lib/scraper'));
getLatestPrices('inland').then(d => {
  const u95 = d.fuels.find(f => f.key === 'unleaded_95');
  assert.strictEqual(d._meta.data_source, 'fuelsindustry.org.za');
  assert.strictEqual(d.effective_date, '2026-10-10');
  assert.strictEqual(d.next_revision, '2026-11-04');
  assert.deepStrictEqual([u95.price, u95.prev, u95.change, u95.direction], [2712, 2620, 92, 'increase']);
  console.log('getLatestPrices:', d.effective_date, '->', d.next_revision, u95);
  console.log('ALL PASS');
});
