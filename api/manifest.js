/**
 * api/manifest.js
 * Vercel serverless function — serves the Stremio addon manifest
 * AND the API health check (combined to stay within Vercel's
 * 12-serverless-function Hobby-plan limit).
 *
 * Routing is determined by the incoming request URL:
 *   /manifest.json        → addon manifest
 *   /api/health           → health check JSON
 */

const { setSecurityHeaders } = require('../lib/securityHeaders');

/* ── Health handler ──────────────────────────────────────────────── */
function handleHealth(_req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const env = process.env.VERCEL ? 'vercel' : (process.env.NODE_ENV || 'development');
  res.status(200).json({
    ok:          true,
    environment: env,
    message:     'API is running correctly.',
  });
}

/* ── Manifest handler ────────────────────────────────────────────── */
function handleManifest(_req, res) {
  const manifest = {
    id:          'community.addon-manager',
    version:     '1.0.0',
    name:        'Addon Manager',
    description: 'Reorder, enable/disable, and organize your installed Stremio addons with a drag-and-drop interface. Requires your Stremio auth key for cloud sync.',

    resources: ['catalog'],
    types:     ['other'],
    catalogs:  [],

    behaviorHints: {
      configurable:          true,
      configurationRequired: false,
    },

    // Stremio opens this URL when the user clicks ⚙ Configure
    config: [
      {
        key:      'note',
        type:     'text',
        title:    'Click Configure to open the Addon Manager.',
        required: false,
      },
    ],
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(manifest);
}

/* ── Router ──────────────────────────────────────────────────────── */
module.exports = (req, res) => {
  setSecurityHeaders(res);

  const url = (req.url || '').split('?')[0]; // strip query string

  if (url === '/api/health' || url === '/api/health/') {
    return handleHealth(req, res);
  }

  // Default: manifest
  return handleManifest(req, res);
};
