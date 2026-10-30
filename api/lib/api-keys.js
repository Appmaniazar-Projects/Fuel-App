/**
 * lib/api-keys.js
 * API Key generation and management system
 */

const crypto = require('crypto');

/**
 * Generate a new API key
 * @param {string} type - Type of key ('live', 'test', 'dev')
 * @param {string} appName - Name of the application
 * @returns {object} Generated key information
 */
function generateAPIKey(type = 'live', appName = 'unknown') {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  
  // Format: fu_[type]_[random]_[timestamp_short]
  const key = `fu_${type}_${random}_${timestamp.toString(36)}`;
  
  return {
    key,
    type,
    appName,
    createdAt: new Date().toISOString(),
    prefix: `fu_${type}_`,
    id: `${type}_${random}_${timestamp.toString(36)}`
  };
}

/**
 * Validate API key format
 * @param {string} key - API key to validate
 * @returns {boolean} True if valid format
 */
function validateAPIKey(key) {
  if (!key || typeof key !== 'string') return false;
  
  // Pattern: fu_[type]_[random]_[timestamp]
  const pattern = /^fu_(live|test|dev)_[a-f0-9]{32}_[a-z0-9]+$/;
  return pattern.test(key);
}

/**
 * Extract key information
 * @param {string} key - API key
 * @returns {object} Key information
 */
function getKeyInfo(key) {
  if (!validateAPIKey(key)) return null;
  
  const parts = key.split('_');
  return {
    type: parts[1],
    random: parts[2],
    timestamp: parts[3],
    prefix: `fu_${parts[1]}_`
  };
}

/**
 * Generate multiple keys for different environments
 * @param {string} appName - Application name
 * @returns {object} Keys for all environments
 */
function generateAppKeys(appName) {
  return {
    live: generateAPIKey('live', appName),
    test: generateAPIKey('test', appName),
    dev: generateAPIKey('dev', appName)
  };
}

module.exports = {
  generateAPIKey,
  validateAPIKey,
  getKeyInfo,
  generateAppKeys
};
