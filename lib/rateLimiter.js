const buckets = new Map();

function hitRateLimit(key, { max = 20, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: max - 1 };
  }

  existing.count += 1;
  if (existing.count > max) {
    return { limited: true, remaining: 0, retryAfterMs: existing.resetAt - now };
  }

  return { limited: false, remaining: max - existing.count };
}

module.exports = { hitRateLimit };
