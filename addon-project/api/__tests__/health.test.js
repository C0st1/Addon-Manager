/**
 * Tests for the /api/health endpoint, which is now handled by api/manifest.js.
 * The handler routes based on req.url — /api/health triggers the health response.
 */

const handler = require('../manifest');

function mockReq(url) {
  return { headers: {}, method: 'GET', url: url || '/api/health' };
}

function mockRes() {
  const res = {};
  res.headers = {};
  res.setHeader = jest.fn((k, v) => { res.headers[k] = v; });
  res.statusCode = null;
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json = jest.fn((body) => { res.body = body; return res; });
  return res;
}

describe('api/health (via api/manifest.js)', () => {
  beforeEach(() => {
    delete process.env.VERCEL;
    delete process.env.NODE_ENV;
  });

  test('returns 200 with ok: true', () => {
    const req = mockReq();
    const res = mockRes();

    handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.message).toBe('API is running correctly.');
  });

  test('sets wildcard CORS header', () => {
    const req = mockReq();
    const res = mockRes();

    handler(req, res);

    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  test('sets security headers', () => {
    const req = mockReq();
    const res = mockRes();

    handler(req, res);

    expect(res.headers['X-Frame-Options']).toBe('DENY');
    expect(res.headers['X-Content-Type-Options']).toBe('nosniff');
  });

  test('detects Vercel environment', () => {
    process.env.VERCEL = '1';
    const req = mockReq();
    const res = mockRes();

    handler(req, res);

    expect(res.body.environment).toBe('vercel');
  });

  test('detects NODE_ENV environment', () => {
    process.env.NODE_ENV = 'test';
    const req = mockReq();
    const res = mockRes();

    handler(req, res);

    expect(res.body.environment).toBe('test');
  });

  test('defaults to development environment', () => {
    const req = mockReq();
    const res = mockRes();

    handler(req, res);

    expect(res.body.environment).toBe('development');
  });

  test('health endpoint works with trailing slash', () => {
    const req = mockReq('/api/health/');
    const res = mockRes();

    handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('health endpoint works with query string', () => {
    const req = mockReq('/api/health?foo=bar');
    const res = mockRes();

    handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
