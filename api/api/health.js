/**
 * GET /api/health
 * Health check — no auth required.
 */
module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({
    success:   true,
    status:    "ok",
    service:   "FillUp API",
    version:   "1.0.0",
    timestamp: new Date().toISOString(),
  });
};
