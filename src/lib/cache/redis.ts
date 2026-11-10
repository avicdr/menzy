import Redis from 'ioredis';

class InMemoryCache {
  private store = new Map<string, { value: string; expiresAt?: number }>();
  private sortedSets = new Map<string, Array<{ score: number; member: string }>>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiresAt: number | undefined;
    if (mode === 'EX' && duration) {
      expiresAt = Date.now() + duration * 1000;
    } else if (mode === 'PX' && duration) {
      expiresAt = Date.now() + duration;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.delete(key);
    this.sortedSets.delete(key);
    return existed ? 1 : 0;
  }

  // Sliding window using sorted set simulation
  async zadd(key: string, score: number, member: string): Promise<number> {
    let set = this.sortedSets.get(key) || [];
    set = set.filter((item) => item.member !== member);
    set.push({ score, member });
    this.sortedSets.set(key, set);
    return 1;
  }

  async zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number> {
    const minVal = min === '-inf' ? -Infinity : Number(min);
    const maxVal = max === '+inf' ? Infinity : Number(max);
    let set = this.sortedSets.get(key) || [];
    const beforeCount = set.length;
    set = set.filter((item) => item.score < minVal || item.score > maxVal);
    this.sortedSets.set(key, set);
    return beforeCount - set.length;
  }

  async zcard(key: string): Promise<number> {
    const set = this.sortedSets.get(key) || [];
    return set.length;
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    const set = this.sortedSets.get(key) || [];
    const members = set.map((s) => s.member);
    const sliceEnd = stop < 0 ? members.length + stop + 1 : stop + 1;
    return members.slice(start, sliceEnd);
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (item) {
      item.expiresAt = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  }
}

// Global cache instance (shared across Next.js route bundles via globalThis)
const globalCacheState = globalThis as typeof globalThis & {
  __menzyRedisClient?: Redis | null;
  __menzyRedisUrl?: string;
  __menzyRedisConnectPromise?: Promise<boolean> | null;
  __menzyRedisDisabledUntil?: number;
  __menzyInMemoryCache?: InMemoryCache;
};

async function getConnectedRedis(): Promise<Redis | null> {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    return null;
  }

  const now = Date.now();
  if (
    globalCacheState.__menzyRedisDisabledUntil &&
    globalCacheState.__menzyRedisDisabledUntil > now
  ) {
    return null;
  }

  if (!globalCacheState.__menzyRedisClient || globalCacheState.__menzyRedisUrl !== redisUrl) {
    try {
      const client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 2000,
        retryStrategy: () => null, // never hang if redis isn't reachable
      });

      client.on('error', () => {
        // Fallback to shared in-memory cache silently
      });

      globalCacheState.__menzyRedisClient = client;
      globalCacheState.__menzyRedisUrl = redisUrl;
      globalCacheState.__menzyRedisConnectPromise = null;
    } catch {
      globalCacheState.__menzyRedisClient = null;
      globalCacheState.__menzyRedisDisabledUntil = now + 30_000;
      return null;
    }
  }

  const client = globalCacheState.__menzyRedisClient;
  if (!client) return null;
  if (client.status === 'ready') {
    return client;
  }

  if (client.status === 'wait' || client.status === 'close' || client.status === 'end') {
    if (client.status === 'close' || client.status === 'end') {
      // Recreate closed client once cooldown clears
      globalCacheState.__menzyRedisDisabledUntil = now + 15_000;
      globalCacheState.__menzyRedisClient = null;
      return null;
    }

    if (!globalCacheState.__menzyRedisConnectPromise) {
      globalCacheState.__menzyRedisConnectPromise = client
        .connect()
        .then(() => true)
        .catch(() => {
          globalCacheState.__menzyRedisDisabledUntil = Date.now() + 30_000;
          return false;
        })
        .finally(() => {
          globalCacheState.__menzyRedisConnectPromise = null;
        });
    }

    await globalCacheState.__menzyRedisConnectPromise;
  }

  return (client.status as string) === 'ready' ? client : null;
}

export function getCache() {
  if (!globalCacheState.__menzyInMemoryCache) {
    globalCacheState.__menzyInMemoryCache = new InMemoryCache();
  }
  const mem = globalCacheState.__menzyInMemoryCache;

  return {
    async get(key: string): Promise<string | null> {
      try {
        const redis = await getConnectedRedis();
        if (redis) {
          return await redis.get(key);
        }
      } catch {}
      return mem.get(key);
    },

    async set(key: string, value: string, mode?: 'EX' | 'PX', duration?: number): Promise<'OK'> {
      try {
        const redis = await getConnectedRedis();
        if (redis) {
          if (mode === 'EX' && duration) {
            return await (redis as any).set(key, value, 'EX', duration);
          } else if (mode === 'PX' && duration) {
            return await (redis as any).set(key, value, 'PX', duration);
          }
          return await redis.set(key, value);
        }
      } catch {}
      return mem.set(key, value, mode, duration);
    },

    async del(key: string): Promise<number> {
      const memDeleted = await mem.del(key);
      try {
        const redis = await getConnectedRedis();
        if (redis) {
          return await redis.del(key);
        }
      } catch {}
      return memDeleted;
    },

    async slidingWindowCheck(
      key: string,
      maxLimit: number,
      windowSeconds: number
    ): Promise<{ allowed: boolean; count: number; retryAfterSeconds: number }> {
      const now = Date.now();
      const clearBefore = now - windowSeconds * 1000;
      const member = `${now}-${Math.random()}`;

      try {
        const redis = await getConnectedRedis();
        if (redis) {
          const multi = redis.multi();
          multi.zremrangebyscore(key, '-inf', clearBefore);
          multi.zadd(key, now, member);
          multi.zcard(key);
          multi.expire(key, windowSeconds);
          const results = await multi.exec();

          const count = (results?.[2]?.[1] as number) || 1;
          const allowed = count <= maxLimit;
          const retryAfterSeconds = allowed ? 0 : windowSeconds;
          return { allowed, count, retryAfterSeconds };
        }
      } catch {}

      // In-Memory sliding window fallback
      await mem.zremrangebyscore(key, '-inf', clearBefore);
      await mem.zadd(key, now, member);
      const count = await mem.zcard(key);
      await mem.expire(key, windowSeconds);

      const allowed = count <= maxLimit;
      const retryAfterSeconds = allowed ? 0 : windowSeconds;
      return { allowed, count, retryAfterSeconds };
    },
  };
}
