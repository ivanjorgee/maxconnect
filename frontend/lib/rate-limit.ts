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

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = Boolean(upstashUrl && upstashToken);

async function upstashCommand<T>(command: Array<string | number>) {
  if (!upstashUrl || !upstashToken) throw new Error("Upstash Redis nao configurado.");
  const response = await fetch(upstashUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) {
    throw new Error(`Upstash Redis error: ${response.status}`);
  }
  const payload = (await response.json()) as { result?: T; error?: string };
  if (payload.error) {
    throw new Error(payload.error);
  }
  return payload.result as T;
}

async function checkRateLimitUpstash(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const count = await upstashCommand<number>(["INCR", key]);
  if (count === 1) {
    await upstashCommand<number>(["PEXPIRE", key, options.windowMs]);
  }
  if (count >= options.max) {
    const ttl = await upstashCommand<number>(["PTTL", key]);
    const retryAfter = ttl > 0 ? Math.ceil(ttl / 1000) : undefined;
    return { ok: false, retryAfter };
  }
  return { ok: true };
}

function checkRateLimitMemory(key: string, options: RateLimitOptions): RateLimitResult {
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

export async function checkRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  if (useUpstash) {
    try {
      return await checkRateLimitUpstash(key, options);
    } catch {
      return checkRateLimitMemory(key, options);
    }
  }
  return checkRateLimitMemory(key, options);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  return realIp || "unknown";
}
