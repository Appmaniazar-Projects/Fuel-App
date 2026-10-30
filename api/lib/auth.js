/**
 * lib/auth.js
 * API key validation middleware for Vercel serverless functions.
 *
 * HOW TO SET UP KEYS:
 * 1. Add valid keys to the FILLUP_API_KEYS environment variable in Vercel
 *    as a comma-separated string:
 *    FILLUP_API_KEYS=fu_live_abc123,fu_live_xyz789
 *
 * 2. Or set FILLUP_MASTER_KEY for a single key:
 *    FILLUP_MASTER_KEY=fu_live_mysecretkey
 *
 * For development, set FILLUP_DEV_MODE=true to skip auth entirely.
 */

function validateApiKey(req) {
  // Skip auth in dev mode
  if (process.env.FILLUP_DEV_MODE === "true") return { valid: true };

  // Vercel Cron Jobs can't set custom headers, but when CRON_SECRET is set
  // in the project they send "Authorization: Bearer <CRON_SECRET>".
  if (
    process.env.CRON_SECRET &&
    req.headers["authorization"] === `Bearer ${process.env.CRON_SECRET}`
  ) {
    return { valid: true };
  }

  const key = req.headers["x-fillup-key"] || req.query.api_key;

  if (!key) {
    return { valid: false, error: "Missing API key. Pass X-FillUp-Key header." };
  }

  // Check master key
  if (process.env.FILLUP_MASTER_KEY && key === process.env.FILLUP_MASTER_KEY) {
    return { valid: true };
  }

  // Check comma-separated key list
  const keyList = (process.env.FILLUP_API_KEYS || "").split(",").map(k => k.trim()).filter(Boolean);
  if (keyList.includes(key)) return { valid: true };

  return { valid: false, error: "Invalid API key." };
}

function withAuth(handler) {
  return async (req, res) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-FillUp-Key");
      return res.status(200).end();
    }

    // Allow only GET and POST for authenticated routes by default
    if (!["GET", "POST"].includes(req.method)) {
      return res.status(405).json({ success: false, error: "Method not allowed." });
    }

    const auth = validateApiKey(req);
    if (!auth.valid) {
      return res.status(401).json({ success: false, error: auth.error });
    }

    // CORS headers on every response
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    return handler(req, res);
  };
}

// Convenience wrapper that enforces auth but is explicit for POST handlers
function withAuthForPost(handler) {
  return async (req, res) => {
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-FillUp-Key");
      return res.status(200).end();
    }

    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method not allowed." });
    }

    const auth = validateApiKey(req);
    if (!auth.valid) {
      return res.status(401).json({ success: false, error: auth.error });
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    return handler(req, res);
  };
}

module.exports = { withAuth, withAuthForPost };
