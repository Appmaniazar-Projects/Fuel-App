/**
 * GET /api/monitoring/health
 * 
 * Monitoring endpoint for scraper health and performance
 * Requires API key for security
 */

const { withAuth } = require("../../lib/auth");
const { getMonitoringStatus, triggerHealthCheck } = require("../../lib/monitoring");
const { ok, error } = require("../../lib/respond");

module.exports = withAuth(async (req, res) => {
  const { action } = req.query;
  
  try {
    if (action === 'check') {
      // Trigger a fresh health check
      const result = await triggerHealthCheck();
      return ok(res, result);
    } else {
      // Get monitoring status report
      const report = await getMonitoringStatus();
      return ok(res, report);
    }
  } catch (err) {
    console.error('Monitoring endpoint error:', err);
    return error(res, 500, 'Monitoring service unavailable');
  }
});
