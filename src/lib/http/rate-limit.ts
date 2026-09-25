import { ApiError } from "./errors";

/**
 * Minimal fixed-window rate limiter kept in process memory. Sufficient for a
 * single school server; swap for a shared store if the app is ever scaled
 * horizontally.
 */
type Bucket = { count: number; resetAt: number };
const g = globalThis as typeof globalThis & { __fcRate?: Map<string, Bucket> };
const buckets = (g.__fcRate ??= new Map<string, Bucket>());

export function rateLimit(key: string, limit: number, windowMs: number): void {
  const current = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= current) {
    buckets.set(key, { count: 1, resetAt: current + windowMs });
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (b.resetAt <= current) buckets.delete(k);
    }
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) throw new ApiError(429, "rate_limited");
}

export function resetRateLimits(): void {
  buckets.clear();
}
