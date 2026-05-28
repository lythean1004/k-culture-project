import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { embed } from './gateway';

let redis: Redis | null = null;
const hasUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

if (hasUpstash) {
  redis = Redis.fromEnv();
}

const TTL = 3600;  // 1시간

export async function embedWithCache(text: string, type: 'query' | 'passage'): Promise<number[]> {
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  const key = `emb:${type}:${hash}`;
  
  if (redis) {
    try {
      const cached = await redis.get<number[]>(key);
      if (cached) return cached;
    } catch (e) {
      console.warn('[Cache] Failed to get cached embedding:', e);
    }
  }
  
  const { vectors } = await embed({ texts: [text], type });
  
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(vectors[0]), { ex: TTL });
    } catch (e) {
      console.warn('[Cache] Failed to set cached embedding:', e);
    }
  }
  
  return vectors[0];
}
