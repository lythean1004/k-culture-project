import { supabaseAdmin } from '../supabase/admin';
import { embedWithCache } from '../ai/embedding/cache';
import { searchSimilarPlaces } from '../ai/embedding/search';
import { Candidate, RecommendInput, ThemeCode } from './types';

export async function isFeatureFlagEnabled(key: string): Promise<boolean> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return key === 'ai_rerank'; // Default true for testing
  }
  try {
    const { data } = await supabaseAdmin
      .from('feature_flags')
      .select('enabled')
      .eq('key', key)
      .maybeSingle();
    return data?.enabled ?? false;
  } catch {
    return false;
  }
}

export async function resolveCityId(cityCode: string): Promise<string> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return '00000000-0000-0000-0000-000000000000';
  }
  const { data } = await supabaseAdmin
    .from('cities')
    .select('city_id')
    .eq('code', cityCode)
    .maybeSingle();
  return data?.city_id || '00000000-0000-0000-0000-000000000000';
}

function mapThemeToText(theme: ThemeCode, lang: string): string {
  const mapping: Record<ThemeCode, string> = {
    HISTORY: 'History Heritage Palace Traditional Temple Historic',
    TRADITIONAL_MUSIC: 'Traditional Music Gugak Instrument Performance Instrument',
    MODERN_ART: 'Modern Art Gallery Exhibition Painting Sculpture',
    FAMILY: 'Family Kids Children Experience Play Fun Zoo Park',
    NIGHT: 'Night view Evening lights Moonlight Romantic River',
    WELLNESS: 'Wellness Nature Forest Relax Temple Healing SPA',
    FOOD: 'Food Local Restaurant K-food Dining Market Street',
    FESTIVAL: 'Festival Season Event Parade Show Carnival'
  };
  return mapping[theme] || '';
}

function mapKopisGenreToTheme(genre: string): ThemeCode {
  if (genre === 'TRADITIONAL_MUSIC') return 'TRADITIONAL_MUSIC';
  return 'FESTIVAL';
}

async function fetchRuleBasedCandidates(input: RecommendInput): Promise<Candidate[]> {
  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!hasSupabase) {
    // Return city-specific mock data when Supabase is not configured
    if (input.cityCode === 'busan') {
      return [
        { id: 'place-busan-1', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '해운대 해수욕장', lat: 35.1587, lng: 129.1604, qualityGrade: 'A', source: 'rule', themes: ['NIGHT', 'FAMILY'] },
        { id: 'place-busan-2', entityType: 'PLACE', primaryType: 'MUSEUM', nameKo: '부산박물관', lat: 35.1295, lng: 129.0934, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
        { id: 'event-busan-1', entityType: 'EVENT', primaryType: 'PERFORMANCE', nameKo: '광안리 어방축제', lat: 35.1532, lng: 129.1186, qualityGrade: 'B', source: 'rule', themes: ['FESTIVAL'] }
      ];
    } else if (input.cityCode === 'gyeongju') {
      return [
        { id: 'place-gj-1', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '불국사', lat: 35.7901, lng: 129.3320, qualityGrade: 'A', source: 'rule', themes: ['HISTORY', 'WELLNESS'] },
        { id: 'place-gj-2', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '동궁과 월지', lat: 35.8348, lng: 129.2266, qualityGrade: 'A', source: 'rule', themes: ['NIGHT', 'HISTORY'] }
      ];
    } else if (input.cityCode === 'jeonju') {
      return [
        { id: 'place-jj-1', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '전주 한옥마을', lat: 35.8147, lng: 127.1526, qualityGrade: 'A', source: 'rule', themes: ['HISTORY', 'FOOD'] }
      ];
    } else if (input.cityCode === 'namwon') {
      return [
        { id: 'place-nw-1', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '광한루원', lat: 35.4057, lng: 127.3804, qualityGrade: 'A', source: 'rule', themes: ['HISTORY', 'NIGHT'] }
      ];
    }
    
    // Default to Seoul
    return [
      { id: 'place-seoul-1', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '경복궁', lat: 37.5796, lng: 126.9770, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
      { id: 'place-seoul-2', entityType: 'PLACE', primaryType: 'MUSEUM', nameKo: '국립중앙박물관', lat: 37.5240, lng: 126.9804, qualityGrade: 'A', source: 'rule', themes: ['HISTORY', 'MODERN_ART'] },
      { id: 'event-seoul-1', entityType: 'EVENT', primaryType: 'PERFORMANCE', nameKo: '전통 국악 공연', lat: 37.5240, lng: 126.9804, qualityGrade: 'B', source: 'rule', themes: ['TRADITIONAL_MUSIC'] }
    ];
  }
  
  const cityId = await resolveCityId(input.cityCode);
  
  const { data: places } = await supabaseAdmin
    .from('places')
    .select('place_id, name_ko, lat, lng, primary_type, sub_type, indoor_outdoor, official_url, phone, place_theme_map(theme_id, themes(code)), place_i18n(lang, name)')
    .eq('city_id', cityId);
    
  const { data: events } = await supabaseAdmin
    .from('events')
    .select('event_id, title_ko, official_url, genre, event_i18n(lang, title)')
    .eq('city_id', cityId)
    .eq('status', 'ACTIVE');

  const candidates: Candidate[] = [];
  
  places?.forEach((p: any) => {
    // Unwrap Supabase relations
    const themeMaps = p.place_theme_map as any[];
    const themes = Array.isArray(themeMaps) 
      ? themeMaps.map((tm: any) => tm.themes?.code as ThemeCode).filter(Boolean) 
      : [];
      
    const nameI18n: Record<string, string> = {};
    if (Array.isArray(p.place_i18n)) {
      p.place_i18n.forEach((item: any) => {
        nameI18n[item.lang] = item.name;
      });
    }
      
    candidates.push({
      id: p.place_id,
      entityType: 'PLACE',
      primaryType: p.primary_type,
      subType: p.sub_type || undefined,
      nameKo: p.name_ko,
      nameI18n,
      lat: p.lat ? parseFloat(p.lat) : undefined,
      lng: p.lng ? parseFloat(p.lng) : undefined,
      qualityGrade: 'A',
      officialUrl: p.official_url || undefined,
      phone: p.phone || undefined,
      source: 'rule',
      themes,
      indoorOutdoor: p.indoor_outdoor || undefined,
    });
  });
  
  events?.forEach((e: any) => {
    const nameI18n: Record<string, string> = {};
    if (Array.isArray(e.event_i18n)) {
      e.event_i18n.forEach((item: any) => {
        nameI18n[item.lang] = item.title;
      });
    }

    candidates.push({
      id: e.event_id,
      entityType: 'EVENT',
      primaryType: 'PERFORMANCE',
      nameKo: e.title_ko,
      nameI18n,
      qualityGrade: 'B',
      officialUrl: e.official_url || undefined,
      source: 'rule',
      themes: [mapKopisGenreToTheme(e.genre)],
    });
  });

  return candidates;
}

function dedupeCandidates(candidates: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  return candidates.filter(c => {
    const key = `${c.entityType}:${c.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function generateCandidates(
  input: RecommendInput
): Promise<Candidate[]> {
  // 1) Rule-based query from DB
  const ruleBased = await fetchRuleBasedCandidates(input);
  
  // 2) AI Semantic query via Embeddings
  const flagEnabled = await isFeatureFlagEnabled('ai_rerank');
  let semanticBased: Candidate[] = [];
  
  if (flagEnabled) {
    try {
      const queryText = [
        ...input.interests.map(i => mapThemeToText(i, input.lang)),
        input.freeTextQuery ?? '',
      ].filter(Boolean).join(' ');
      
      const queryVector = await embedWithCache(queryText, 'query');
      const cityId = await resolveCityId(input.cityCode);
      
      const placesByEmbedding = await searchSimilarPlaces({
        queryVector,
        cityId,
        lang: input.lang,
        limit: 80,
      });
      
      semanticBased = placesByEmbedding.map((p: any) => ({
        id: p.place_id,
        entityType: 'PLACE',
        primaryType: p.primary_type,
        nameKo: p.name,
        nameI18n: { [input.lang]: p.name },
        lat: p.lat,
        lng: p.lng,
        qualityGrade: 'A',
        source: 'semantic',
        semanticSimilarity: p.similarity,
        themes: input.interests, // Assume matches interests
      }));
    } catch (e) {
      console.warn('Semantic search failed, using rule-based only', e);
    }
  }
  
  // 3) Merge and Dedupe
  return dedupeCandidates([...ruleBased, ...semanticBased]);
}
