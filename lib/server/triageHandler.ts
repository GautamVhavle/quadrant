import { heuristicVerdict, parseTriageRequest, type TriageRequest, type Verdict } from '../triage';
import type { RateLimiter } from './rateLimit';

export interface TriageHandlerDeps {
  /** True when a usable model key is configured. */
  hasKey: () => boolean;
  /** Returns null on any model failure so the handler can fall back. */
  model: (input: TriageRequest) => Promise<Omit<Verdict, 'mode'> | null>;
  limiter: RateLimiter;
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') ?? 'anonymous';
}

/**
 * The whole route contract as a pure function so it can be tested without a
 * server. The Next route handler only injects the real model, key check and
 * limiter, which keeps every branch of this reachable from a unit test.
 */
export async function handleTriage(request: Request, deps: TriageHandlerDeps): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid-json' }, 400);
  }

  const parsed = parseTriageRequest(body);
  if (!parsed) return json({ error: 'invalid-request' }, 400);

  const limit = deps.limiter.check(clientKey(request));
  if (!limit.ok) {
    return json({ error: 'rate-limited', retryAfter: limit.retryAfter, limit: limit.limit }, 429, {
      'Retry-After': String(limit.retryAfter),
    });
  }

  // No key configured: the rule answers and the interface says so.
  if (!deps.hasKey()) {
    return json({ verdict: heuristicVerdict(parsed.task, parsed.answers, 'offline'), remaining: limit.remaining });
  }

  const modelResult = await deps.model(parsed);
  if (!modelResult) {
    return json({
      verdict: heuristicVerdict(parsed.task, parsed.answers, 'online'),
      remaining: limit.remaining,
      degraded: true,
    });
  }

  return json({ verdict: { ...modelResult, mode: 'online' }, remaining: limit.remaining });
}
