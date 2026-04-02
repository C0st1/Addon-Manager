const { setSecurityHeaders, generateCspNonce } = require('../securityHeaders');

function mockRes() {
  const res = {};
  res.headers = {};
  res.setHeader = jest.fn((k, v) => { res.headers[k] = v; });
  return res;
}

describe('lib/securityHeaders', () => {
  describe('generateCspNonce', () => {
    test('returns a base64 string', () => {
      const nonce = generateCspNonce();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
      // Base64 characters only
      expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    test('returns different values on each call', () => {
      const a = generateCspNonce();
      const b = generateCspNonce();
      expect(a).not.toBe(b);
    });
  });

  describe('setSecurityHeaders', () => {
    test('sets default API security headers including HSTS', () => {
      const res = mockRes();

      setSecurityHeaders(res);

      expect(res.headers['X-Frame-Options']).toBe('DENY');
      expect(res.headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(res.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(res.headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
      expect(res.headers['Content-Security-Policy']).toBeUndefined();
    });

    test('throws if type is html but no nonce is provided', () => {
      const res = mockRes();

      expect(() => setSecurityHeaders(res, 'html')).toThrow(
        'CSP nonce is required when type is "html"'
      );
      expect(res.headers['Content-Security-Policy']).toBeUndefined();
    });

    test('throws if type is html but nonce is empty string', () => {
      const res = mockRes();

      expect(() => setSecurityHeaders(res, 'html', { nonce: '' })).toThrow(
        'CSP nonce is required when type is "html"'
      );
    });

    test('sets CSP headers with nonce when type is html and nonce is provided', () => {
      const res = mockRes();
      const nonce = 'test-nonce-abc123';

      setSecurityHeaders(res, 'html', { nonce });

      expect(res.headers['Content-Security-Policy']).toBeDefined();
      expect(res.headers['Content-Security-Policy']).toContain("default-src 'none'");
      expect(res.headers['Content-Security-Policy']).toContain(`script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net`);
      // script-src should NOT have unsafe-inline (style-src still uses it)
      const scriptSrcMatch = res.headers['Content-Security-Policy'].match(/script-src[^;]+/);
      expect(scriptSrcMatch).not.toBeNull();
      expect(scriptSrcMatch[0]).not.toContain("'unsafe-inline'");
      // HSTS is always set
      expect(res.headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
    });

    test('does NOT set CSP headers when type is api', () => {
      const res = mockRes();

      setSecurityHeaders(res, 'api');

      expect(res.headers['Content-Security-Policy']).toBeUndefined();
    });

    test('defaults to api when no type specified', () => {
      const res = mockRes();

      setSecurityHeaders(res);

      expect(res.headers['Content-Security-Policy']).toBeUndefined();
    });
  });
});
