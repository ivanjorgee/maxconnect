type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type RateLimitResult = {
  ok: boolean;
  retryAfter?: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true };
  }
  if (existing.count >= options.max) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    return { ok: false, retryAfter };
  }
  existing.count += 1;
  store.set(key, existing);
  return { ok: true };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  return realIp || "unknown";
}
