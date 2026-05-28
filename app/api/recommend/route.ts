import { NextRequest } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { cache } from '../../../lib/cache';
import { generateCandidates } from '../../../lib/recommend/candidates';
import { applyFilters } from '../../../lib/recommend/filters';
import { scoreCandidate } from '../../../lib/recommend/scorer';
import { aiRerank } from '../../../lib/recommend/ai-rerank';
import { bundlePackages } from '../../../lib/recommend/bundler';
import { generateReasonText } from '../../../lib/recommend/reason';
import { RecommendContext, RecommendInput, ThemeCode } from '../../../lib/recommend/types';
import { supabaseAdmin } from '../../../lib/supabase/admin';

const RecommendInputSchema = z.object({
  sessionId: z.string().optional(),
  cityCode: z.enum(['seoul', 'busan', 'gyeongju', 'jeonju', 'namwon']),
  visitForm: z.enum(['DAY_TRIP', 'STAY_1_3', 'THEME_TOUR']),
  interests: z.array(z.string()).max(5),
  freeTextQuery: z.string().max(200).optional(),
  lang: z.enum(['en', 'ja', 'zh-Hans', 'zh-Hant']),
  transportMode: z.enum(['WALK', 'TRANSIT', 'CAR']),
  currentLocation: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

function hashInput(input: any): string {
  const str = JSON.stringify(input);
  return crypto.createHash('md5').update(str).digest('hex');
}

async function buildContext(input: any): Promise<RecommendContext> {
  let weather = 'Clear';
  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (hasSupabase) {
    try {
      const { data } = await supabaseAdmin
        .from('weather_snapshots')
        .select('weather_code')
        .eq('area_key', input.cityCode)
        .order('forecast_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (data && data.weather_code) {
        weather = data.weather_code;
      }
    } catch (e) {
      console.warn('[Build Context] Failed to fetch weather snapshot from database:', e);
    }
  }

  return {
    now: new Date(),
    weather,
    anchorPlaces: input.currentLocation ? [input.currentLocation] : [],
  };
}

async function savePackages(packages: any[], input: any) {
  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hasSupabase) return;
  
  for (const pkg of packages) {
    try {
      const reasonSource = pkg.reasonTextSource === 'LLM_GENERATED' ? 'LLM_GENERATED' : 'MT_GLOSSARY';
      const { data: insertedPkg, error } = await supabaseAdmin
        .from('packages')
        .insert({
          visit_form: input.visitForm,
          title: pkg.title,
          summary: pkg.summary,
          reason_text: pkg.reasonText,
          reason_text_source: reasonSource,
          lang: input.lang,
        })
        .select('package_id')
        .single();
        
      if (error || !insertedPkg) continue;

      const itemsToInsert = pkg.items.map((item: any, idx: number) => ({
        package_id: insertedPkg.package_id,
        seq: idx + 1,
        item_type: item.itemType,
        ref_id: item.refId,
        slot_type: item.slotType,
      }));
      
      await supabaseAdmin.from('package_items').insert(itemsToInsert);
    } catch (e) {
      console.error('Failed to save packages to Supabase:', e);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = RecommendInputSchema.parse(body) as unknown as RecommendInput;
    
    // Bump version to v2 to burst old caches (e.g. invalid Seoul fallback for Busan)
    const cacheKey = `rec:v2:${hashInput(input)}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return Response.json(JSON.parse(cached));
    }
    
    const context = await buildContext(input);
    const candidates = await generateCandidates(input);
    const filtered = applyFilters(candidates, input, context);
    const scored = filtered.map(c => {
      const score = scoreCandidate(c, input, context);
      return {
        ...c,
        score,
      };
    });
    
    const reranked = await aiRerank(scored, input);
    const packages = bundlePackages(reranked, input);
    
    // Generate reason texts via AI or templates
    for (const pkg of packages) {
      const { text, source } = await generateReasonText(pkg, input, context);
      pkg.reasonText = text;
      pkg.reasonTextSource = source;
    }
    
    const result = { packages };
    await cache.set(cacheKey, JSON.stringify(result), 300); // 5 minutes cache TTL
    await savePackages(packages, input);
    
    return Response.json(result);
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
