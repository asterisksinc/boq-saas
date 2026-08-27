type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (existing.count >= limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  existing.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export function rateLimitKey(request: Request, action: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${action}:${forwarded ?? "unknown"}`;
}
