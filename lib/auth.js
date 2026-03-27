const crypto = require('crypto');

const SESSION_COOKIE = 'stremio_session';

function getSecret() {
  return process.env.SESSION_SECRET || 'dev-only-secret-change-me';
}

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(data) {
  return crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
}

function createSessionToken(payload, maxAgeSeconds = 60 * 30) {
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + maxAgeSeconds,
  };
  const encoded = base64Url(JSON.stringify(body));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  const expected = sign(encoded);
  if (signature !== expected) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  return cookieHeader.split(';').reduce((acc, part) => {
    const [k, ...v] = part.trim().split('=');
    if (!k) return acc;
    acc[k] = decodeURIComponent(v.join('=') || '');
    return acc;
  }, {});
}

function getAuthKeyFromRequest(req) {
  const bodyKey = req.body?.authKey;
  if (bodyKey) return bodyKey;

  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  const payload = verifySessionToken(token);
  return payload?.authKey || '';
}

function setSessionCookie(res, authKey) {
  const secure = process.env.NODE_ENV !== 'development';
  const token = createSessionToken({ authKey });
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1800${secure ? '; Secure' : ''}`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

module.exports = {
  getAuthKeyFromRequest,
  setSessionCookie,
  clearSessionCookie,
};
