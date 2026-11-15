/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a fixed-window counter keyed by client IP. Because this is in-memory,
 * it is per-instance — on multi-instance deployments (Docker Compose with
 * multiple replicas, or behind a load balancer) each instance tracks its own
 * counters. For production, consider Redis-backed rate limiting instead.
 *
 * `limit` = max requests per `windowMs` window.
 *
 * Returns `{ allowed: boolean; remaining: number; resetAt: number }`.
 */
interface RateLimitEntry {
  count: number
  windowStart: number
}

const stores = new Map<string, RateLimitEntry>()
const CLEANUP_INTERVAL_MS = 60_000

// Periodically clean stale entries to prevent unbounded memory growth.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of stores.entries()) {
      if (now - entry.windowStart > CLEANUP_INTERVAL_MS) {
        stores.delete(key)
      }
    }
  }, CLEANUP_INTERVAL_MS)
}

export function rateLimit(
  identifier: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = stores.get(identifier)

  if (!entry || now - entry.windowStart >= windowMs) {
    stores.set(identifier, { count: 1, windowStart: now })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.windowStart + windowMs }
  }

  entry.count += 1
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.windowStart + windowMs }
}

/** Extract a client identifier from the request (IP address). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    // X-Forwarded-For can be a comma-separated list; take the first (client)
    return forwarded.split(",")[0].trim()
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return "unknown"
}
