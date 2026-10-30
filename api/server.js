// Local development server. In production (Vercel) each file in api/ is
// deployed as its own function; this mirrors those routes for local use.
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const routes = {
  '/api/health': require('./api/health'),
  '/api/macro': require('./api/macro'),
  '/api/fuel/current': require('./api/fuel/current'),
  '/api/fuel/changes': require('./api/fuel/changes'),
  '/api/fuel/history': require('./api/fuel/history'),
  '/api/fuel/keys': require('./api/fuel/keys'),
  '/api/fuel/update-monthly': require('./api/fuel/update-monthly'),
  '/api/monitoring/health': require('./api/monitoring/health'),
  '/api/stations/import': require('./api/stations/import'),
};

app.get('/api', (req, res) =>
  res.json({ success: true, status: 'ok', service: 'FillUp API', version: '1.0.0', routes: Object.keys(routes) })
);

for (const [path, handler] of Object.entries(routes)) {
  app.all(path, handler);
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`FillUp API running locally on http://localhost:${PORT}/api`);
  });
}

module.exports = app;
