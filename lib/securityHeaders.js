const crypto = require('crypto');

/**
 * Shared helpers for setting security-related HTTP headers across all
 * API endpoints and HTML pages.
 */

/**
 * Generates a cryptographically random nonce for CSP.
 *
 * @returns {string} Base64-encoded nonce string.
 */
function generateCspNonce() {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Sets common security headers on a response.
 *
 * @param {import('http').ServerResponse} res
 * @param {'api'|'html'} [type='api']  Set to 'html' to also include CSP headers.
 * @param {object}  [opts]
 * @param {string}  [opts.nonce]  CSP nonce for allowing specific inline scripts.
 *                                  **Required** when `type` is `'html'` to prevent
 *                                  accidental fallback to `'unsafe-inline'`. Call
 *                                  `generateCspNonce()` to create one per request.
 */
function setSecurityHeaders(res, type = 'api', opts = {}) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  if (type === 'html') {
    if (!opts.nonce) {
      throw new Error(
        'CSP nonce is required when type is "html". Call generateCspNonce() and pass it via opts.nonce. ' +
        'This prevents accidental fallback to unsafe-inline.'
      );
    }

    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; " +
      `script-src 'self' 'nonce-${opts.nonce}' https://cdn.jsdelivr.net; ` +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://api.strem.io https://cdn.jsdelivr.net; " +
      "font-src 'self'; " +
      "frame-ancestors 'none'"
    );
  }
}

module.exports = { setSecurityHeaders, generateCspNonce };
