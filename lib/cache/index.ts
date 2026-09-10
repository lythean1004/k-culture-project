import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

class RedisCache {
  private client: Redis | null = null;
  private memoryCache = new Map<string, { value: string; expiresAt?: number }>();

  constructor() {
    if (typeof window === 'undefined' && redisUrl) {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 1500,
        retryStrategy: () => null,
      });
      
      this.client.on('error', (err) => {
        console.error('Redis connection error:', err);
      });
    }
  }

  async get(key: string): Promise<string | null> {
    // 1. Try Memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem) {
      if (!memoryItem.expiresAt || memoryItem.expiresAt > Date.now()) {
        return memoryItem.value;
      }
      this.memoryCache.delete(key);
    }

    if (!this.client) return null;
    try {
      const val = await this.client.get(key);
      if (val) {
        // Sync back to memory
        this.memoryCache.set(key, { value: val, expiresAt: Date.now() + 30_000 });
      }
      return val;
    } catch (e) {
      console.warn('[Cache] Redis is offline. Bypassing get cache to memory.');
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryCache.set(key, { value, expiresAt });

    if (!this.client) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (e) {
      console.warn('[Cache] Redis is offline. Bypassing set cache to memory.');
    }
  }

  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);

    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (e) {
      console.warn('[Cache] Redis is offline. Bypassing del cache.');
    }
  }
}

export const cache = new RedisCache();
