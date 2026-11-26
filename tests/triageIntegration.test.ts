import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleTriage } from '../lib/server/triageHandler';
import { hasApiKey, modelVerdict } from '../lib/server/openrouter';
import { createRateLimiter } from '../lib/server/rateLimit';
import type { Verdict } from '../lib/triage';

/**
 * The seam the other two suites miss: the real handler calling the real
 * OpenRouter client, with only the network mocked. This is the closest thing
 * to the deployed path you can run without a key.
 */
const body = {
  task: 'send the revised proposal to Meera before the 4pm call',
  answers: { q1: true, q2: true, q3: true, q4: false },
};

function post(): Request {
  return new Request('http://localhost/api/triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
    body: JSON.stringify(body),
  });
}

function request() {
  return {
    hasKey: hasApiKey,
    model: modelVerdict,
    limiter: createRateLimiter({ limit: 20, windowMs: 60_000, now: () => 0 }),
  };
}

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubEnv('OPENROUTER_API_KEY', 'sk-or-v1-test-key');
  vi.stubEnv('OPENROUTER_MODEL', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function stubModel(content: string, status = 200) {
  fetchSpy = vi.fn(
    async () =>
      new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
  vi.stubGlobal('fetch', fetchSpy);
}

describe('the server path with a mocked model', () => {
  it('turns a model reply into an online verdict', async () => {
    stubModel(
      JSON.stringify({
        quadrant: 'do',
        title: 'Send the revised proposal to Meera',
        reason: 'The 4pm call is today and a person is waiting.',
        confidence: 0.91,
      }),
    );

    const response = await handleTriage(post(), request());
    const payload = (await response.json()) as { verdict: Verdict; remaining: number; degraded?: boolean };

    expect(response.status).toBe(200);
    expect(payload.degraded).toBeUndefined();
    expect(payload.verdict).toMatchObject({
      quadrant: 'do',
      title: 'Send the revised proposal to Meera',
      confidence: 0.91,
      source: 'model',
      mode: 'online',
    });
    expect(payload.remaining).toBe(19);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('survives a model outage with the rule and flags the degradation', async () => {
    stubModel('upstream exploded', 503);

    const response = await handleTriage(post(), request());
    const payload = (await response.json()) as { verdict: Verdict; degraded?: boolean };

    expect(response.status).toBe(200);
    expect(payload.degraded).toBe(true);
    expect(payload.verdict).toMatchObject({ quadrant: 'do', source: 'heuristic', mode: 'online' });
  });

  it('never reaches the network when there is no key', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    stubModel('{}');

    const response = await handleTriage(post(), request());
    const payload = (await response.json()) as { verdict: Verdict };

    expect(payload.verdict).toMatchObject({ source: 'heuristic', mode: 'offline' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends the key as a header and leaves it out of the prompt', async () => {
    stubModel(JSON.stringify({ quadrant: 'schedule', reason: 'No deadline yet.', confidence: 0.6 }));

    await handleTriage(post(), request());

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('openrouter.ai');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-or-v1-test-key');
    expect(String(init.body)).not.toContain('sk-or-v1-test-key');
    expect(String(init.body)).toContain('send the revised proposal to Meera before the 4pm call');
  });
});
