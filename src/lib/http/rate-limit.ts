import { ApiError } from "./errors";

/**
 * Minimal fixed-window rate limiter kept in process memory. Sufficient for a
 * single school server; swap for a shared store if the app is ever scaled
 * horizontally.
 */
type Bucket = { count: number; resetAt: number };
const g = globalThis as typeof globalThis & { __fcRate?: Map<string, Bucket> };
const buckets = (g.__fcRate ??= new Map<string, Bucket>());

export function rateLimit(key: string, limit: number, windowMs: number, cost = 1): void {
  const current = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= current) {
    if (cost > limit) throw new ApiError(429, "rate_limited");
    buckets.set(key, { count: cost, resetAt: current + windowMs });
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (b.resetAt <= current) buckets.delete(k);
    }
    return;
  }
  bucket.count += cost;
  if (bucket.count > limit) throw new ApiError(429, "rate_limited");
}

export function resetRateLimits(): void {
  buckets.clear();
}

/** Whether a key has used up its limit (without counting a new hit). */
export function isRateLimited(key: string, limit: number): boolean {
  const bucket = buckets.get(key);
  return Boolean(bucket && bucket.resetAt > Date.now() && bucket.count >= limit);
}

export function clearRateLimit(key: string): void {
  buckets.delete(key);
}

/** Failed sign-ins are counted per username, so changing the claimed IP address does not help an attacker. */
export const LOGIN_FAILURES = { limit: 10, windowMs: 15 * 60_000, key: (username: string) => `login-fail:${username.trim().toLowerCase()}` };
