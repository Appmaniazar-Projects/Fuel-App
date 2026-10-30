/**
 * lib/respond.js
 * Standardised JSON response helpers.
 */

function ok(res, data, meta = {}) {
  return res.status(200).json({
    success: true,
    data,
    meta: {
      version:    "1",
      fetched_at: new Date().toISOString(),
      ...meta,
    },
  });
}

function error(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    error:   message,
    meta: {
      version:    "1",
      fetched_at: new Date().toISOString(),
    },
  });
}

module.exports = { ok, error };
