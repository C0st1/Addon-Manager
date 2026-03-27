/**
 * api/addons/get.js
 * Vercel serverless function — fetches the user's addon collection from the Stremio cloud.
 */

const stremioAPI = require('../../lib/stremioAPI');
const { getAuthKeyFromRequest } = require('../../lib/auth');
const { logEvent } = require('../../lib/logger');

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

  if (!authKey) {
    res.status(400).json({
      ok:    false,
      error: 'An auth key is required. Find it in Stremio → Settings → Account.',
    });
    return;
  }

  try {
    const result = await stremioAPI.cloudGetAddons(authKey);
    res.status(200).json({ ok: true, ...result });
  } catch (err) {
    await logEvent('error', 'addons_get_failed', { message: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
};
