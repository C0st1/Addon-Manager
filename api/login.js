/**
 * api/login.js
 * Vercel serverless function — logs into Stremio and returns the Auth Key.
 */
const stremioAPI = require('../lib/stremioAPI');
const { hitRateLimit } = require('../lib/rateLimiter');
const { logEvent } = require('../lib/logger');
const { setSessionCookie, clearSessionCookie } = require('../lib/auth');

module.exports = async (req, res) => {
  // Handle CORS pre-flight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  if (req.body?.logout) {
    clearSessionCookie(res);
    res.status(200).json({ ok: true });
    return;
  }

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const limit = hitRateLimit(`login:${ip}`, { max: 10, windowMs: 60_000 });
  if (limit.limited) {
    await logEvent('warn', 'login_rate_limited', { ip });
    res.status(429).json({ ok: false, error: 'Too many login attempts. Try again in a minute.' });
    return;
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(400).json({ ok: false, error: 'Email and password are required' });
    return;
  }

  try {
    const authKey = await stremioAPI.cloudLogin(email, password);
    setSessionCookie(res, authKey);
    res.status(200).json({ ok: true, authKey });
  } catch (err) {
    await logEvent('error', 'login_failed', { ip, message: err.message });
    res.status(401).json({ ok: false, error: err.message });
  }
};
