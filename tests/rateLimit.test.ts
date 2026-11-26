import { describe, expect, it } from 'vitest';
import { createRateLimiter } from '../lib/server/rateLimit';

function clock(start = 0) {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

describe('createRateLimiter', () => {
  it('allows requests up to the limit and then refuses', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000, now: () => 0 });
    expect(limiter.check('ip').ok).toBe(true);
    expect(limiter.check('ip').ok).toBe(true);
    expect(limiter.check('ip').ok).toBe(true);
    const blocked = limiter.check('ip');
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('counts remaining requests down', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000, now: () => 0 });
    expect(limiter.check('ip').remaining).toBe(2);
    expect(limiter.check('ip').remaining).toBe(1);
  });

  it('reports a retry delay in seconds', () => {
    const time = clock();
    const limiter = createRateLimiter({ limit: 1, windowMs: 30_000, now: time.now });
    limiter.check('ip');
    time.advance(10_000);
    const blocked = limiter.check('ip');
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBe(20);
  });

  it('frees capacity once the window slides past', () => {
    const time = clock();
    const limiter = createRateLimiter({ limit: 2, windowMs: 10_000, now: time.now });
    limiter.check('ip');
    limiter.check('ip');
    expect(limiter.check('ip').ok).toBe(false);
    time.advance(10_001);
    expect(limiter.check('ip').ok).toBe(true);
  });

  it('keeps clients independent', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => 0 });
    expect(limiter.check('a').ok).toBe(true);
    expect(limiter.check('b').ok).toBe(true);
    expect(limiter.check('a').ok).toBe(false);
  });

  it('expires idle clients from the map', () => {
    const time = clock();
    const limiter = createRateLimiter({ limit: 5, windowMs: 1000, now: time.now });
    limiter.check('a');
    limiter.check('b');
    expect(limiter.size()).toBe(2);
    time.advance(5000);
    limiter.check('c');
    expect(limiter.size()).toBeLessThanOrEqual(3);
  });

  it('never returns a zero second retry', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 200, now: () => 0 });
    limiter.check('ip');
    expect(limiter.check('ip').retryAfter).toBeGreaterThanOrEqual(1);
  });
});
