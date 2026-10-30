// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;


// Middleware
app.use(cors());
app.use(express.json());



// Load API routes
const health = require('./api/health');
const fuelCurrent = require('./api/fuel/current');

// Routes
app.get('/api', (req, res) => res.json({ success: true, status: 'ok', service: 'FillUp API', version: '1.0.0', timestamp: new Date().toISOString() }));
app.get('/api/health', health);
app.get('/api/fuel/current', fuelCurrent);

// Start server
app.listen(PORT, () => {
  console.log(`FillUp API running locally on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
