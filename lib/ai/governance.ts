import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { supabaseAdmin } from '../supabase/admin';
import { ChatCompletionRequest } from './types';

let redis: Redis | null = null;
let geminiLimiter: Ratelimit | null = null;
let geminiDailyLimiter: Ratelimit | null = null;

const hasUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

if (hasUpstash) {
  redis = Redis.fromEnv();
  
  geminiLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(15, '1 m'),
    prefix: 'ai:gemini',
  });

  geminiDailyLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1400, '1 d'),
    prefix: 'ai:gemini:daily',
  });
}

export async function checkRateLimit(backend: string) {
  if (backend !== 'gemini') return;
  
  if (!geminiLimiter || !geminiDailyLimiter) {
    console.warn('[Governance] Upstash Redis configuration missing. Bypassing rate limit check.');
    return;
  }
  
  const [minute, daily] = await Promise.all([
    geminiLimiter.limit('global'),
    geminiDailyLimiter.limit('global'),
  ]);
  
  if (!minute.success || !daily.success) {
    throw new Error('AI_RATE_LIMIT_EXCEEDED');
  }
}

export function maskPII(req: ChatCompletionRequest): ChatCompletionRequest {
  const cloned = JSON.parse(JSON.stringify(req)) as ChatCompletionRequest;
  
  // Generalize locations (latitude and longitude rounded to 2 decimal places for city-level privacy)
  cloned.messages = cloned.messages.map((m) => {
    let content = m.content;
    
    // Pattern to match numeric coordinates
    const coordPattern = /(lat|latitude|lng|longitude|map[xy])[\s:="']+(\d+\.\d+)/gi;
    content = content.replace(coordPattern, (match, key, val) => {
      const rounded = parseFloat(val).toFixed(2);
      return `${key}: ${rounded}`;
    });
    
    return {
      ...m,
      content,
    };
  });
  
  return cloned;
}

export async function auditLog(entry: {
  purpose: string;
  provider: string;
  modelName: string;
  inputPayload: any;
  output: any;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  errorCode: string | null;
  sessionId?: string;
}) {
  // If Supabase environment credentials are not present, fallback to log to console
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[Audit Log (Console Fallback)]', JSON.stringify(entry, null, 2));
    return;
  }

  supabaseAdmin
    .from('ai_prompt_audit')
    .insert({
      purpose: entry.purpose,
      provider: entry.provider,
      model_name: entry.modelName,
      system_prompt_version: 'v1',
      input_payload: entry.inputPayload,
      output: entry.output,
      tokens_in: entry.tokensIn,
      tokens_out: entry.tokensOut,
      latency_ms: entry.latencyMs,
      error_code: entry.errorCode,
      session_id: entry.sessionId || null,
    })
    .then(({ error }) => {
      if (error) console.error('Audit log failed:', error);
    });
}
