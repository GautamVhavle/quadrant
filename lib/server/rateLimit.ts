export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Seconds until the oldest hit in the window expires. */
  retryAfter: number;
  limit: number;
}

export interface RateLimiter {
  check: (key: string) => RateLimitResult;
  size: () => number;
}

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  /** Injectable clock so the window logic is testable. */
  now?: () => number;
}

/**
 * Sliding window limiter held in memory.
 *
 * This state is per server instance, so a cold start resets it and two
 * concurrent instances count separately. It is enough to stop a single client
 * hammering the endpoint, and a shared store is the upgrade for real traffic.
 */
export function createRateLimiter({ limit, windowMs, now = Date.now }: RateLimiterOptions): RateLimiter {
  const hits = new Map<string, number[]>();

  function prune(key: string, current: number): number[] {
    const recent = (hits.get(key) ?? []).filter((stamp) => current - stamp < windowMs);
    if (recent.length) hits.set(key, recent);
    else hits.delete(key);
    return recent;
  }

  return {
    check(key: string): RateLimitResult {
      const current = now();
      const recent = prune(key, current);

      if (recent.length >= limit) {
        const oldest = recent[0];
        const retryAfter = Math.max(1, Math.ceil((windowMs - (current - oldest)) / 1000));
        return { ok: false, remaining: 0, retryAfter, limit };
      }

      recent.push(current);
      hits.set(key, recent);

      // Keep the map from growing without bound under many distinct clients.
      if (hits.size > 5000) {
        for (const storedKey of hits.keys()) {
          if (prune(storedKey, current).length === 0) hits.delete(storedKey);
          if (hits.size <= 4000) break;
        }
      }

      return { ok: true, remaining: limit - recent.length, retryAfter: 0, limit };
    },
    size() {
      return hits.size;
    },
  };
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

const LIMIT = positiveInt(process.env.TRIAGE_REQUESTS_PER_WINDOW, 12);
const WINDOW_MS = positiveInt(process.env.TRIAGE_WINDOW_SECONDS, 600) * 1000;

export const triageLimiter = createRateLimiter({ limit: LIMIT, windowMs: WINDOW_MS });
