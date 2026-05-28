import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisCache {
  private client: Redis | null = null;

  constructor() {
    if (typeof window === 'undefined') {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
      });
      
      this.client.on('error', (err) => {
        console.error('Redis connection error:', err);
      });
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch (e) {
      console.warn('[Cache] Redis is offline. Bypassing get cache.');
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (e) {
      console.warn('[Cache] Redis is offline. Bypassing set cache.');
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (e) {
      console.warn('[Cache] Redis is offline. Bypassing del cache.');
    }
  }
}

export const cache = new RedisCache();
