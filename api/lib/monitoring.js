/**
 * lib/monitoring.js
 * Monitoring and alerting system for scraper health and structure changes
 */

const cheerio = require('cheerio');
const { scraperHealthCheck } = require('./scraper');

// ── Monitoring Configuration ─────────────────────────────────────────────
const MONITORING_CONFIG = {
  alertThresholds: {
    consecutiveFailures: 3,
    dataCompletenessMin: 70, // percentage
    responseTimeMax: 10000 // milliseconds
  },
  retention: {
    logs: 7, // days
    metrics: 30 // days
  }
};

// ── In-memory storage (in production, use a database) ─────────────────────
const monitoringStore = {
  healthHistory: [],
  failureLog: [],
  performanceMetrics: [],
  alerts: []
};

// ── Health Monitoring ───────────────────────────────────────────────────
async function monitorScraperHealth() {
  const timestamp = new Date().toISOString();
  
  try {
    const health = await scraperHealthCheck();
    const healthRecord = {
      timestamp,
      ...health,
      overallStatus: health.status
    };
    
    monitoringStore.healthHistory.push(healthRecord);
    
    // Check for issues
    const issues = [];
    
    Object.entries(health.sources).forEach(([source, status]) => {
      if (status.status === 'unavailable') {
        issues.push(`${source} is unavailable: ${status.error}`);
      }
    });
    
    if (issues.length > 0) {
      await createAlert('SCRAPER_UNAVAILABLE', issues.join('; '), 'warning');
    }
    
    // Cleanup old records
    cleanupOldRecords();
    
    return {
      status: 'success',
      health,
      issues,
      timestamp
    };
    
  } catch (error) {
    const failureRecord = {
      timestamp,
      error: error.message,
      type: 'health_check_failure'
    };
    
    monitoringStore.failureLog.push(failureRecord);
    await createAlert('HEALTH_CHECK_FAILED', error.message, 'error');
    
    return {
      status: 'error',
      error: error.message,
      timestamp
    };
  }
}

// ── Performance Monitoring ───────────────────────────────────────────────
async function monitorScrapingPerformance(scrapingResult) {
  const timestamp = new Date().toISOString();
  
  const performanceRecord = {
    timestamp,
    source: scrapingResult._meta?.source || 'unknown',
    strategies_tried: scrapingResult._meta?.strategies_tried || 1,
    data_completeness: scrapingResult._meta?.validation?.completeness || 0,
    response_time: scrapingResult._meta?.responseTime || 0,
    success: scrapingResult._meta?.validation?.isValid || false
  };
  
  monitoringStore.performanceMetrics.push(performanceRecord);
  
  // Check for performance issues
  const issues = [];
  
  if (performanceRecord.data_completeness < MONITORING_CONFIG.alertThresholds.dataCompletenessMin) {
    issues.push(`Low data completeness: ${performanceRecord.data_completeness}%`);
  }
  
  if (performanceRecord.strategies_tried > 2) {
    issues.push(`Multiple fallbacks needed: ${performanceRecord.strategies_tried} strategies tried`);
  }
  
  if (performanceRecord.response_time > MONITORING_CONFIG.alertThresholds.responseTimeMax) {
    issues.push(`Slow response time: ${performanceRecord.response_time}ms`);
  }
  
  if (issues.length > 0) {
    await createAlert('PERFORMANCE_ISSUE', issues.join('; '), 'warning');
  }
  
  return performanceRecord;
}

// ── Structure Change Detection ───────────────────────────────────────────
async function detectStructureChanges(html, source) {
  const timestamp = new Date().toISOString();
  
  // Simple structure fingerprinting
  const fingerprint = createStructureFingerprint(html);
  
  // Store fingerprint (in production, use database)
  const fingerprintKey = `${source}_fingerprint`;
  const lastFingerprint = monitoringStore[fingerprintKey];
  
  if (lastFingerprint && lastFingerprint !== fingerprint) {
    await createAlert(
      'STRUCTURE_CHANGE', 
      `Structure change detected for ${source}. Fingerprint changed from ${lastFingerprint.substring(0, 8)}... to ${fingerprint.substring(0, 8)}...`,
      'warning'
    );
  }
  
  monitoringStore[fingerprintKey] = fingerprint;
  
  return {
    fingerprint,
    changed: lastFingerprint && lastFingerprint !== fingerprint,
    timestamp
  };
}

function createStructureFingerprint(html) {
  // Create a simple fingerprint based on key structural elements
  const $ = cheerio.load(html);
  
  const elements = {
    tables: $('table').length,
    links: $('a[href*="fuel"], a[href*="price"]').length,
    headings: $('h1, h2, h3, h4').length,
    priceElements: $('*:contains("R"), *:contains("Rands"), *:contains("cents")').length,
    totalElements: $('*').length
  };
  
  // Create hash-like fingerprint
  return Object.values(elements).join('-');
}

// ── Alert System ─────────────────────────────────────────────────────────
async function createAlert(type, message, severity = 'info') {
  const alert = {
    id: generateAlertId(),
    type,
    message,
    severity,
    timestamp: new Date().toISOString(),
    resolved: false
  };
  
  monitoringStore.alerts.push(alert);
  
  // Log alert (in production, send to notification system)
  console.log(`🚨 ALERT [${severity.toUpperCase()}] ${type}: ${message}`);
  
  // Check for consecutive failures
  if (type === 'SCRAPER_UNAVAILABLE') {
    const recentFailures = monitoringStore.failureLog.filter(
      f => f.timestamp > new Date(Date.now() - 3600000).toISOString() // Last hour
    );
    
    if (recentFailures.length >= MONITORING_CONFIG.alertThresholds.consecutiveFailures) {
      await createAlert('CRITICAL_FAILURE', 'Multiple consecutive scraper failures detected', 'critical');
    }
  }
  
  return alert;
}

function generateAlertId() {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ── Reporting ─────────────────────────────────────────────────────────────
function getMonitoringReport() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentHealth = monitoringStore.healthHistory.filter(
    h => new Date(h.timestamp) > last24h
  );
  
  const recentPerformance = monitoringStore.performanceMetrics.filter(
    p => new Date(p.timestamp) > last24h
  );
  
  const activeAlerts = monitoringStore.alerts.filter(a => !a.resolved);
  
  return {
    summary: {
      total_health_checks: recentHealth.length,
      total_scrapes: recentPerformance.length,
      active_alerts: activeAlerts.length,
      uptime_percentage: calculateUptime(recentHealth)
    },
    health: recentHealth.slice(-10), // Last 10 checks
    performance: recentPerformance.slice(-20), // Last 20 scrapes
    alerts: activeAlerts,
    generated_at: now.toISOString()
  };
}

function calculateUptime(healthRecords) {
  if (healthRecords.length === 0) return 0;
  
  const healthyCount = healthRecords.filter(h => h.overallStatus === 'healthy').length;
  return Math.round((healthyCount / healthRecords.length) * 100);
}

// ── Cleanup ───────────────────────────────────────────────────────────────
function cleanupOldRecords() {
  const now = new Date();
  const logsRetention = new Date(now.getTime() - MONITORING_CONFIG.retention.logs * 24 * 60 * 60 * 1000);
  const metricsRetention = new Date(now.getTime() - MONITORING_CONFIG.retention.metrics * 24 * 60 * 60 * 1000);
  
  monitoringStore.healthHistory = monitoringStore.healthHistory.filter(
    h => new Date(h.timestamp) > logsRetention
  );
  
  monitoringStore.failureLog = monitoringStore.failureLog.filter(
    f => new Date(f.timestamp) > logsRetention
  );
  
  monitoringStore.performanceMetrics = monitoringStore.performanceMetrics.filter(
    p => new Date(p.timestamp) > metricsRetention
  );
  
  // Resolve old alerts
  monitoringStore.alerts.forEach(alert => {
    if (new Date(alert.timestamp) < logsRetention) {
      alert.resolved = true;
    }
  });
}

// ── API Endpoints for Monitoring ─────────────────────────────────────────
async function getMonitoringStatus(req, res) {
  try {
    const report = getMonitoringReport();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function triggerHealthCheck(req, res) {
  try {
    const result = await monitorScraperHealth();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  monitorScraperHealth,
  monitorScrapingPerformance,
  detectStructureChanges,
  createAlert,
  getMonitoringReport,
  getMonitoringStatus,
  triggerHealthCheck,
  MONITORING_CONFIG
};
