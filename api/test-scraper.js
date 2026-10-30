// test-scraper.js
require('dotenv').config();
const { getLatestPrices } = require('./lib/scraper'); 

(async () => {
  console.log('Starting scraper test...');
  const start = Date.now();
  try {
    const result = await getLatestPrices();
    console.log(`Done in ${Date.now() - start}ms`);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Scraper threw:', err);
  }
})();