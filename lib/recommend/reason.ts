import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { chatCompletion } from '@/lib/ai/gateway';
import { buildReasonTextPrompt } from '@/lib/ai/prompts/reason-text';
import { isFeatureFlagEnabled } from './candidates';
import { RecommendContext, RecommendInput, RecommendedPackage } from './types';
import { cache as localCache } from '../cache';

let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
  }
} catch (e) {
  console.warn('[Reason Cache] Failed to initialize Upstash Redis:', e);
}

const TTL = 86400;  // 24시간

function hashContext(context: RecommendContext): string {
  const str = `${context.weather || ''}:${context.anchorPlaces.map(a => `${a.lat.toFixed(4)},${a.lng.toFixed(4)}`).join(';')}`;
  return crypto.createHash('md5').update(str).digest('hex');
}

function formatWeather(weather?: string): string {
  return weather || 'Clear';
}

export async function generateReasonText(
  pkg: RecommendedPackage,
  input: RecommendInput,
  context: RecommendContext
): Promise<{ text: string; source: 'LLM_GENERATED' | 'TEMPLATE_FALLBACK' }> {
  
  // 1. 캐시 키 (같은 패키지·언어·컨텍스트는 재사용)
  const cacheKey = `reason:${pkg.packageId}:${input.lang}:${hashContext(context)}`;
  
  let cached: string | null = null;
  if (redis) {
    try {
      cached = await redis.get<string>(cacheKey);
    } catch (e) {
      console.warn('[Reason Cache] Upstash Redis offline during get:', e);
    }
  } else {
    // Upstash Redis가 없을 경우 로컬 ioredis 캐시 사용
    cached = await localCache.get(cacheKey);
  }
  
  if (cached) {
    console.log('[Reason Cache] Cache HIT for key:', cacheKey);
    return { text: cached, source: 'LLM_GENERATED' };
  }
  
  // 2. Feature flag 확인
  const enabled = await isFeatureFlagEnabled('ai_reason_text');
  if (!enabled) {
    console.log('[Reason] Feature flag "ai_reason_text" disabled, using fallback');
    return fallbackTemplate(pkg, input);
  }
  
  // 3. LLM 호출
  try {
    const messages = buildReasonTextPrompt({
      lang: input.lang,
      visitForm: input.visitForm,
      interests: input.interests,
      weather: formatWeather(context.weather),
      timeSlot: input.startTimePref ?? 'AFTERNOON',
      packageMeta: serializePackageForLLM(pkg, input.lang),
    });
    
    const response = await chatCompletion({
      messages,
      purpose: 'REASON_TEXT',
      temperature: 0.4,
      maxTokens: 200,
    });
    
    const text = response.content.trim();
    
    // 4. 환각 검증 (간단한 규칙)
    if (containsHallucination(text, pkg)) {
      console.warn('Possible hallucination in reason text, using fallback:', text);
      return fallbackTemplate(pkg, input);
    }
    
    // 5. 캐시 저장
    if (redis) {
      try {
        await redis.setex(cacheKey, TTL, text);
      } catch (e) {
        console.warn('[Reason Cache] Upstash Redis offline during set:', e);
      }
    } else {
      await localCache.set(cacheKey, text, TTL);
    }
    
    return { text, source: 'LLM_GENERATED' };
  } catch (e) {
    console.error('Reason text generation failed:', e);
    return fallbackTemplate(pkg, input);
  }
}

export function containsHallucination(text: string, pkg: RecommendedPackage): boolean {
  // 숫자(가격·시간) 패턴 검출
  if (/\d{1,2}:\d{2}/.test(text)) return true;  // 시간 패턴
  if (/[\d,]+\s*(원|won|yen|元)/i.test(text)) return true;  // 가격 패턴
  if (/(km|미터|meter|分|分钟)/i.test(text)) return true;  // 거리·시간 단위
  return false;
}

function fallbackTemplate(pkg: RecommendedPackage, input: RecommendInput): { text: string; source: 'TEMPLATE_FALLBACK' } {
  const templates = {
    en: `A ${input.visitForm.toLowerCase().replace('_',' ')} curated for your interest in ${input.interests.join(' and ')}.`,
    ja: `あなたの興味（${input.interests.join('・')}）に合わせた${input.visitForm}コース。`,
    'zh-Hans': `根据您的兴趣（${input.interests.join('、')}）精心策划的${input.visitForm}行程。`,
    'zh-Hant': `根據您的興趣（${input.interests.join('、')}）精心策劃的${input.visitForm}行程。`,
  };
  return { text: templates[input.lang] || templates['en'], source: 'TEMPLATE_FALLBACK' };
}

function serializePackageForLLM(pkg: RecommendedPackage, lang: string) {
  // LLM에 전달할 안전한 메타데이터만 추출
  // 사실 진술이 필요한 필드(가격·시간)는 제외
  return {
    theme: pkg.themeCode,
    cityName: pkg.cityName,
    items: pkg.items.map(i => ({
      name: (i.nameI18n && i.nameI18n[lang]) ? i.nameI18n[lang] : i.nameKo ?? i.name,
      type: i.primaryType,
      slot: i.slotType,
    })),
    duration_category: (pkg.durationHours ?? 8) < 6 ? 'short' : 'full',
  };
}
