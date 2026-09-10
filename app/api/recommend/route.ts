import { NextRequest } from 'next/server';
import { z } from 'zod';

export const dynamic = "force-dynamic";
import crypto from 'crypto';
import { cache } from '../../../lib/cache';
import { generateCandidates, resolveCityId } from '../../../lib/recommend/candidates';
import { applyFilters } from '../../../lib/recommend/filters';
import { scoreCandidate } from '../../../lib/recommend/scorer';
import { aiRerank } from '../../../lib/recommend/ai-rerank';
import { bundlePackages } from '../../../lib/recommend/bundler';
import { generateReasonText } from '../../../lib/recommend/reason';
import { RecommendContext, RecommendInput, ThemeCode } from '../../../lib/recommend/types';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { CITY_CODE_VALUES, dayCountFromVisitForm, normalizeCityCodes, visitFormFromDayCount } from '../../../lib/recommend/cities';
import { storeSnapshot } from '../../../lib/recommend/snapshots';

const NULL_UUID = '00000000-0000-0000-0000-000000000000';

const RecommendInputSchema = z.object({
  sessionId: z.string().optional(),
  cityCode: z.enum(CITY_CODE_VALUES),
  cityCodes: z.array(z.enum(CITY_CODE_VALUES)).max(3).optional(),
  tripDays: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  visitForm: z.enum(['DAY_TRIP', 'STAY_1_3', 'THEME_TOUR']),
  interests: z.array(z.enum(['HISTORY', 'TRADITIONAL_MUSIC', 'MODERN_ART', 'FAMILY', 'NIGHT', 'WELLNESS', 'FOOD', 'FESTIVAL'])).max(5),
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

  const selectedCityCodes = normalizeCityCodes(input.cityCode, input.cityCodes);

  return {
    now: new Date(),
    weather,
    anchorPlaces: selectedCityCodes.length === 1 && input.currentLocation ? [input.currentLocation] : [],
  };
}

async function resolveThemeId(themeCode?: string): Promise<string | null> {
  if (!themeCode || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const { data } = await supabaseAdmin
    .from('themes')
    .select('theme_id')
    .eq('code', themeCode)
    .maybeSingle();

  return data?.theme_id || null;
}

async function savePackages(packages: any[], input: any) {
  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hasSupabase) return;

  const containsLocalFallback = packages.some(pkg => pkg.items?.some((item: any) => item.source === 'mock'));
  if (containsLocalFallback) return;

  const resolvedCityId = await resolveCityId(input.cityCode);
  const cityId = resolvedCityId !== NULL_UUID ? resolvedCityId : null;
  
  for (const pkg of packages) {
    try {
      const reasonSource = pkg.reasonTextSource === 'LLM_GENERATED' ? 'LLM_GENERATED' : 'MT_GLOSSARY';
      const themeId = await resolveThemeId(pkg.themeCode);
      const { data: insertedPkg, error } = await supabaseAdmin
        .from('packages')
        .insert({
          city_id: cityId,
          visit_form: input.visitForm,
          theme_id: themeId,
          title: pkg.title,
          summary: pkg.summary,
          duration_hours: pkg.durationHours,
          score: pkg.totalScore,
          reason_text: pkg.reasonText,
          reason_text_source: reasonSource,
          lang: input.lang,
        })
        .select('package_id')
        .single();
        
      if (error || !insertedPkg) continue;

      // CRITICAL FIX: Overwrite the mock packageId with the actual UUID from the database
      // so the frontend routes to the correct package detail page.
      pkg.packageId = insertedPkg.package_id;

      const itemsToInsert = pkg.items.map((item: any, idx: number) => ({
        package_id: insertedPkg.package_id,
        seq: idx + 1,
        item_type: item.itemType,
        ref_id: item.refId,
        slot_type: item.slotType,
        replacement_group: item.dayNumber ? `day:${item.dayNumber}` : null,
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
    const parsed = RecommendInputSchema.parse(body);
    const selectedCityCodes = normalizeCityCodes(parsed.cityCode, parsed.cityCodes);
    const requestedDays = dayCountFromVisitForm(parsed.visitForm, parsed.tripDays);
    const tripDays = Math.max(requestedDays, Math.min(selectedCityCodes.length, 3)) as 1 | 2 | 3;
    const input = {
      ...parsed,
      cityCode: selectedCityCodes[0],
      cityCodes: selectedCityCodes,
      tripDays,
      visitForm: visitFormFromDayCount(tripDays),
    } as unknown as RecommendInput;
    
    // Bump version when recommendation composition rules change.
    const cacheKey = `rec:v11:${hashInput(input)}`;
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
    
    for (const pkg of packages) {
      pkg.packageId = `route-${crypto.randomUUID()}`;
      await storeSnapshot(pkg);
    }
    const result = { packages, dataSource: packages.some(pkg => pkg.items.some(item => item.source === 'mock')) ? 'local-catalog' : 'database' };
    await cache.set(cacheKey, JSON.stringify(result), 300); // 5 minutes cache TTL
    
    return Response.json(result);
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
