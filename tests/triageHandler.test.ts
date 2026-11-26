import { describe, expect, it, vi } from 'vitest';
import { createRateLimiter } from '../lib/server/rateLimit';
import type { Verdict } from '../lib/triage';

/**
 * These tests describe the route contract. The handler is a pure function with
 * its dependencies injected, so the model and the limiter are mocked here and
 * the real Next route stays a thin adapter.
 */
import { handleTriage } from '../lib/server/triageHandler';

const modelVerdict: Omit<Verdict, 'mode'> = {
  quadrant: 'do',
  title: 'Send the revised proposal',
  reason: 'A person is waiting and the call is today.',
  confidence: 0.88,
  source: 'model',
};

const body = {
  task: 'send the revised proposal',
  answers: { q1: true, q2: true, q3: true, q4: false },
};

function post(payload: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
}

function deps(overrides: Partial<Parameters<typeof handleTriage>[1]> = {}) {
  return {
    hasKey: () => true,
    model: vi.fn(async () => modelVerdict),
    limiter: createRateLimiter({ limit: 100, windowMs: 60_000, now: () => 0 }),
    ...overrides,
  };
}

describe('handleTriage validation', () => {
  it('rejects a body that is not JSON', async () => {
    const response = await handleTriage(post('not json'), deps());
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid-json' });
  });

  it('rejects a task with no answers', async () => {
    const response = await handleTriage(post({ task: 'something' }), deps());
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid-request' });
  });

  it('rejects an empty task', async () => {
    const response = await handleTriage(post({ ...body, task: '   ' }), deps());
    expect(response.status).toBe(400);
  });

  it('rejects non boolean answers', async () => {
    const response = await handleTriage(
      post({ ...body, answers: { q1: 'yes', q2: true, q3: true, q4: false } }),
      deps(),
    );
    expect(response.status).toBe(400);
  });
});

describe('handleTriage rate limiting', () => {
  it('returns 429 with a retry hint once the window is full', async () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 30_000, now: () => 0 });

    const first = await handleTriage(post(body), deps({ limiter }));
    expect(first.status).toBe(200);

    const second = await handleTriage(post(body), deps({ limiter }));
    expect(second.status).toBe(429);
    expect(second.headers.get('Retry-After')).toBe('30');
    expect(await second.json()).toEqual({ error: 'rate-limited', retryAfter: 30, limit: 1 });
  });

  it('counts each client separately using the forwarded address', async () => {
    const seen: string[] = [];
    const limiter = {
      check: (key: string) => {
        seen.push(key);
        return { ok: true, remaining: 1, retryAfter: 0, limit: 10 };
      },
      size: () => seen.length,
    };

    await handleTriage(post(body, { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }), deps({ limiter }));
    await handleTriage(post(body, { 'x-real-ip': '198.51.100.2' }), deps({ limiter }));
    await handleTriage(post(body), deps({ limiter }));

    expect(seen).toEqual(['203.0.113.7', '198.51.100.2', 'anonymous']);
  });

  it('does not call the model when the request is already limited', async () => {
    const limiter = createRateLimiter({ limit: 0, windowMs: 1000, now: () => 0 });
    const model = vi.fn(async () => modelVerdict);

    const response = await handleTriage(post(body), deps({ limiter, model }));

    expect(response.status).toBe(429);
    expect(model).not.toHaveBeenCalled();
  });
});

describe('handleTriage without a model', () => {
  it('answers from the rule and says the mode is offline', async () => {
    const model = vi.fn(async () => modelVerdict);

    const response = await handleTriage(post(body), deps({ hasKey: () => false, model }));
    const payload = (await response.json()) as { verdict: Verdict };

    expect(response.status).toBe(200);
    expect(payload.verdict).toMatchObject({ quadrant: 'do', source: 'heuristic', mode: 'offline' });
    expect(model).not.toHaveBeenCalled();
  });
});

describe('handleTriage with a model', () => {
  it('returns the model verdict and marks it online', async () => {
    const response = await handleTriage(post(body), deps());
    const payload = (await response.json()) as { verdict: Verdict; remaining: number };

    expect(response.status).toBe(200);
    expect(payload.verdict).toMatchObject({
      quadrant: 'do',
      reason: modelVerdict.reason,
      source: 'model',
      mode: 'online',
    });
    expect(payload.remaining).toBe(99);
  });

  it('falls back to the rule and flags it as degraded when the model fails', async () => {
    const model = vi.fn(async () => null);

    const response = await handleTriage(post(body), deps({ model }));
    const payload = (await response.json()) as { verdict: Verdict; degraded?: boolean };

    expect(response.status).toBe(200);
    expect(payload.degraded).toBe(true);
    expect(payload.verdict.source).toBe('heuristic');
    expect(payload.verdict.mode).toBe('online');
  });

  it('passes the trimmed task and the answers to the model', async () => {
    const model = vi.fn(async () => modelVerdict);

    await handleTriage(post({ ...body, task: '  send the revised proposal  ' }), deps({ model }));

    expect(model).toHaveBeenCalledWith({
      task: 'send the revised proposal',
      answers: body.answers,
    });
  });

  it('marks every response as uncacheable', async () => {
    const response = await handleTriage(post(body), deps());
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
