# Security & Threat Model

This document describes the security architecture, design trade-offs, and threat model for the Stremio Addon Manager.

## Authentication

Sessions are authenticated via HMAC-SHA256 signed tokens stored in HttpOnly, SameSite=Lax, Secure cookies. The signing secret (`SESSION_SECRET`) must be set in Vercel environment variables in production — the server will refuse to start without it.

Credentials are never stored. Login requests are proxied directly to `api.strem.io` and only the returned `authKey` is kept in the session cookie.

## Session IP Binding

Sessions are bound to the client IP address at the time of creation (login or manual auth key entry). Any subsequent authenticated request from a different IP will receive a 403 response, and the user must re-authenticate.

**Trade-off:** IP bindings are stored in-memory and reset on every Vercel cold start. On a warm instance, this provides replay protection. After a cold start, the binding is gone and any IP can use a valid session token until the next login rebinding. This is acceptable because Vercel's warm instances are typically reused within a short window, and the session token itself still requires a valid HMAC signature.

## CSRF Protection

CSRF tokens are generated per-page-load in the configure page (`/configure`) and injected into the HTML. The token is sent with every POST request via the `X-CSRF-Token` header. Tokens are single-use and server-bound via a signed salt cookie.

### Opt-In Design

CSRF validation is **opt-in**: if a request omits the `X-CSRF-Token` header entirely, it passes without CSRF validation. This is a deliberate design decision to support non-browser API clients (scripts, automation tools) that don't have access to the configure page where tokens are generated.

**Why this is safe enough:**

- **SameSite=Lax cookies** already prevent most CSRF attacks by blocking cross-origin POST requests from third-party sites. The cookie simply won't be sent in cross-origin contexts.
- **IP binding** adds a second layer: even if a token were somehow leaked, it can only be used from the same IP.
- **HMAC-signed session tokens** mean an attacker can't forge a valid session even with the cookie value.

The primary remaining risk is a same-origin attack (e.g., XSS within the configure page), which is mitigated by the CSP nonce-based script policy.

## Content Security Policy

The configure page uses a **per-request nonce** for `script-src`. This means:

- No `'unsafe-inline'` in `script-src` — all inline `<script>` tags require a matching `nonce` attribute
- `style-src` still uses `'unsafe-inline'` (inline styles cannot execute JavaScript)
- `generateCspNonce()` is called in `configure.js` and passed to `setSecurityHeaders()`. If the nonce is missing, the server throws an error rather than silently falling back to `'unsafe-inline'`

## Rate Limiting

Rate limits are applied per-IP per-endpoint using a sliding window counter. For the `set` endpoint, rate limiting occurs **before** body parsing and decompression to prevent DoS via large compressed payloads.

**Serverless limitation:** Rate limit state is stored in-memory and resets on every Vercel cold start. For production deployments requiring persistent rate limiting, the `rateLimiter.js` module supports an `externalStore` parameter for integration with Vercel KV or Upstash Redis.

## Security Headers

All responses include:

| Header | Value | Purpose |
|---|---|---|
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enforces HTTPS (HSTS) |
| `Content-Security-Policy` | Nonce-based | Prevents XSS (HTML pages only) |

## Error Sanitization

All error responses go through `sanitizeError()` which strips internal details (stack traces, file paths, internal state) before sending to the client. Production errors return generic messages; detailed errors are logged server-side via `logEvent()`.

## Production Checklist

- [ ] Set `SESSION_SECRET` to a cryptographically random string (32+ characters) in Vercel environment variables
- [ ] (Optional) Add Vercel KV or Upstash Redis for persistent rate limiting
- [ ] Verify HTTPS is enforced on your custom domain (Vercel does this by default)
- [ ] Review the `cors.js` module if deploying on a custom domain with specific CORS requirements
