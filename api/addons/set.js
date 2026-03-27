/**
 * api/addons/set.js
 * Vercel serverless function — saves the user's addon collection to the Stremio cloud.
 */

const stremioAPI = require('../../lib/stremioAPI');
const { getAuthKeyFromRequest } = require('../../lib/auth');
const { hitRateLimit } = require('../../lib/rateLimiter');
const { logEvent } = require('../../lib/logger');
const zlib = require('zlib');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const authKey = getAuthKeyFromRequest(req);
  let { addons } = req.body || {};

  if (!Array.isArray(addons) && req.body?.compressedAddons) {
    try {
      const raw = Buffer.from(req.body.compressedAddons, 'base64');
      const encoding = req.body.compression === 'br' ? 'br' : 'gzip';
      const decompressed = encoding === 'br' ? zlib.brotliDecompressSync(raw) : zlib.gunzipSync(raw);
      addons = JSON.parse(decompressed.toString('utf8'));
    } catch (err) {
      res.status(400).json({ ok: false, error: `Invalid compressed payload: ${err.message}` });
      return;
    }
  }

  if (!Array.isArray(addons)) {
    res.status(400).json({ ok: false, error: '"addons" must be an array' });
    return;
  }

  if (!authKey) {
    res.status(400).json({
      ok:    false,
      error: 'An auth key is required to save your addons.',
    });
    return;
  }

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const limit = hitRateLimit(`set:${ip}`, { max: 50, windowMs: 60_000 });
  if (limit.limited) {
    await logEvent('warn', 'addons_set_rate_limited', { ip, addonsCount: addons.length });
    res.status(429).json({ ok: false, error: 'Rate limit exceeded. Please retry shortly.' });
    return;
  }

  try {
    const result = await stremioAPI.cloudSetAddons(addons, authKey);
    res.status(200).json({ ok: true, result });
  } catch (err) {
    await logEvent('error', 'addons_set_failed', { message: err.message, addonsCount: addons.length });
    res.status(500).json({ ok: false, error: err.message });
  }
};
