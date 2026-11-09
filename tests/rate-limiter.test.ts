import { describe, it, expect, beforeEach } from 'vitest';
import { getCache } from '../src/lib/cache/redis';

describe('Diner AI Sliding-Window Rate Limiter', () => {
  const cache = getCache();

  it('allows requests within the 25-request limit', async () => {
    const key = `test:session:${Date.now()}`;
    const maxLimit = 25;
    const windowSeconds = 300;

    // Send 5 requests
    for (let i = 0; i < 5; i++) {
      const res = await cache.slidingWindowCheck(key, maxLimit, windowSeconds);
      expect(res.allowed).toBe(true);
      expect(res.count).toBe(i + 1);
    }
  });

  it('blocks request #26 when 25-request rolling window is exhausted', async () => {
    const key = `test:exhaust:${Date.now()}`;
    const maxLimit = 25;
    const windowSeconds = 300;

    // Fill to 25
    for (let i = 0; i < 25; i++) {
      const res = await cache.slidingWindowCheck(key, maxLimit, windowSeconds);
      expect(res.allowed).toBe(true);
    }

    // 26th request must be rejected
    const blockedRes = await cache.slidingWindowCheck(key, maxLimit, windowSeconds);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.count).toBe(26);
    expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0);
  });
});

