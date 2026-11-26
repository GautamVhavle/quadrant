import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hasApiKey, modelVerdict } from '../lib/server/openrouter';
import type { TriageRequest } from '../lib/triage';

const input: TriageRequest = {
  task: 'send the revised proposal to Meera',
  answers: { q1: true, q2: true, q3: true, q4: false },
};

function completion(content: string, status = 200) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function stubFetch(handler: (url: string, init: RequestInit) => Promise<Response>) {
  const spy = vi.fn(handler);
  vi.stubGlobal('fetch', spy);
  return spy;
}

let fetchSpy: ReturnType<typeof vi.fn> | null = null;

beforeEach(() => {
  vi.stubEnv('OPENROUTER_API_KEY', 'sk-or-v1-test-key');
  vi.stubEnv('OPENROUTER_MODEL', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchSpy = null;
});

describe('hasApiKey', () => {
  it('is false when unset', () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    expect(hasApiKey()).toBe(false);
  });

  it('is false for the placeholder from the example file', () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'sk-or-v1-DUMMY-REPLACE-ME');
    expect(hasApiKey()).toBe(false);
  });

  it('is true for a plausible key', () => {
    expect(hasApiKey()).toBe(true);
  });
});

describe('modelVerdict request shape', () => {
  it('calls OpenRouter with the model, a JSON contract and the four answers', async () => {
    fetchSpy = stubFetch(async () =>
      completion(JSON.stringify({ quadrant: 'do', title: 'Send it', reason: 'A person is waiting.', confidence: 0.9 })),
    );

    await modelVerdict(input);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(init.method).toBe('POST');

    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer sk-or-v1-test-key');

    const body = JSON.parse(String(init.body)) as {
      model: string;
      temperature: number;
      response_format: { type: string };
      messages: Array<{ role: string; content: string }>;
    };
    expect(body.model).toBe('openai/gpt-4o-mini');
    expect(body.temperature).toBeLessThan(0.5);
    expect(body.response_format.type).toBe('json_object');

    const prompt = body.messages.map((message) => message.content).join('\n');
    expect(prompt).toContain('send the revised proposal to Meera');
    expect(prompt).toContain('Answer: yes');
    expect(prompt).toContain('Answer: no');
    expect(prompt).toContain('delegate');
  });

  it('honours OPENROUTER_MODEL', async () => {
    vi.stubEnv('OPENROUTER_MODEL', 'anthropic/claude-haiku-4');
    fetchSpy = stubFetch(async () =>
      completion(JSON.stringify({ quadrant: 'do', title: 'x', reason: 'because', confidence: 0.5 })),
    );

    await modelVerdict(input);

    const body = JSON.parse(String((fetchSpy.mock.calls[0][1] as RequestInit).body)) as { model: string };
    expect(body.model).toBe('anthropic/claude-haiku-4');
  });

  it('never puts the key in the request body', async () => {
    fetchSpy = stubFetch(async () =>
      completion(JSON.stringify({ quadrant: 'do', title: 'x', reason: 'because', confidence: 0.5 })),
    );

    await modelVerdict(input);

    expect(String((fetchSpy.mock.calls[0][1] as RequestInit).body)).not.toContain('sk-or-v1-test-key');
  });

  it('does not call the network without a usable key', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'sk-or-v1-DUMMY-REPLACE-ME');
    fetchSpy = stubFetch(async () => completion('{}'));

    expect(await modelVerdict(input)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('modelVerdict parsing', () => {
  it('parses a clean JSON reply', async () => {
    stubFetch(async () =>
      completion(
        JSON.stringify({ quadrant: 'schedule', title: 'Draft the plan', reason: 'Worth real time.', confidence: 0.72 }),
      ),
    );

    expect(await modelVerdict(input)).toEqual({
      quadrant: 'schedule',
      title: 'Draft the plan',
      reason: 'Worth real time.',
      confidence: 0.72,
      source: 'model',
    });
  });

  it('parses JSON wrapped in a code fence', async () => {
    stubFetch(async () =>
      completion('```json\n{"quadrant":"delegate","title":"Hand it over","reason":"Not yours.","confidence":0.66}\n```'),
    );

    const verdict = await modelVerdict(input);
    expect(verdict?.quadrant).toBe('delegate');
    expect(verdict?.source).toBe('model');
  });

  it('clamps a confidence outside the allowed range', async () => {
    stubFetch(async () => completion(JSON.stringify({ quadrant: 'do', reason: 'because', confidence: 12 })));
    expect((await modelVerdict(input))?.confidence).toBe(0.99);
  });

  it('returns null when the quadrant is unknown', async () => {
    stubFetch(async () => completion(JSON.stringify({ quadrant: 'someday', reason: 'because', confidence: 0.5 })));
    expect(await modelVerdict(input)).toBeNull();
  });

  it('returns null when the reason is missing', async () => {
    stubFetch(async () => completion(JSON.stringify({ quadrant: 'do', confidence: 0.5 })));
    expect(await modelVerdict(input)).toBeNull();
  });

  it('returns null when the content is not JSON at all', async () => {
    stubFetch(async () => completion('I think this is urgent and important.'));
    expect(await modelVerdict(input)).toBeNull();
  });

  it('returns null when there is no message content', async () => {
    stubFetch(async () => new Response(JSON.stringify({ choices: [] }), { status: 200 }));
    expect(await modelVerdict(input)).toBeNull();
  });
});

describe('modelVerdict failure handling', () => {
  it('returns null on a server error', async () => {
    stubFetch(async () => new Response('nope', { status: 500 }));
    expect(await modelVerdict(input)).toBeNull();
  });

  it('returns null on an authentication error', async () => {
    stubFetch(async () => new Response('bad key', { status: 401 }));
    expect(await modelVerdict(input)).toBeNull();
  });

  it('returns null on a network failure', async () => {
    stubFetch(async () => {
      throw new TypeError('fetch failed');
    });
    expect(await modelVerdict(input)).toBeNull();
  });

  it('returns null when the request times out', async () => {
    stubFetch(async () => {
      throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
    });
    expect(await modelVerdict(input)).toBeNull();
  });

  it('passes an abort signal so a slow model cannot hang the request', async () => {
    fetchSpy = stubFetch(async () =>
      completion(JSON.stringify({ quadrant: 'do', reason: 'because', confidence: 0.5 })),
    );

    await modelVerdict(input);

    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});
