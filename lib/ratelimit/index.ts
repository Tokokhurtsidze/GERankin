import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis/client";

// Per-instance fallback: real backpressure when Upstash isn't configured, but
// resets on cold start and doesn't share state across concurrent serverless
// instances. Once UPSTASH_REDIS_REST_URL/TOKEN are set, every caller below
// automatically switches to a real cross-instance sliding-window limit.
const memoryStore = new Map<string, number[]>();

function memoryAllow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (memoryStore.get(key) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  memoryStore.set(key, timestamps);
  return timestamps.length <= limit;
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, limit: number, windowSeconds: number): Ratelimit {
  const cacheKey = `${name}:${limit}:${windowSeconds}`;
  const existing = limiters.get(cacheKey);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    prefix: `ratelimit:${name}`,
  });
  limiters.set(cacheKey, limiter);
  return limiter;
}

/** Returns true if the request is allowed, false if it should be rejected (429). */
export async function checkRateLimit(
  name: string,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  if (redis) {
    const { success } = await getLimiter(name, limit, windowSeconds).limit(key);
    return success;
  }
  return memoryAllow(`${name}:${key}`, limit, windowSeconds * 1000);
}
