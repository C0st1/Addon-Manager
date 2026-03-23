/**
 * api/health.js
 * Vercel serverless function — health check.
 * On Vercel, the local Stremio server is never reachable
 * (it runs on the user's machine, not the Vercel edge).
 * We report this honestly so the UI can guide the user.
 */

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    ok:                    true,
    localStremioReachable: false,   // always false on Vercel
    environment:           'vercel',
    message:               'Running on Vercel. Use Cloud mode with your Stremio auth key.',
  });
};
