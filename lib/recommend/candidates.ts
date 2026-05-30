import { supabaseAdmin } from '../supabase/admin';
import { embedWithCache } from '../ai/embedding/cache';
import { searchSimilarPlaces } from '../ai/embedding/search';
import { Candidate, RecommendInput, ThemeCode } from './types';

const NULL_UUID = '00000000-0000-0000-0000-000000000000';

function hasSupabaseConfig(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function isFeatureFlagEnabled(key: string): Promise<boolean> {
  if (!hasSupabaseConfig()) {
    return false;
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
  if (!hasSupabaseConfig()) {
    return NULL_UUID;
  }
  const { data } = await supabaseAdmin
    .from('cities')
    .select('city_id')
    .eq('code', cityCode)
    .maybeSingle();
  return data?.city_id || NULL_UUID;
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

export function getCityMockData(cityCode: string): Candidate[] {
  const mockDb: Record<string, Candidate[]> = {
    seoul: [
      { id: '00000000-0000-0000-0000-000000000001', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '경복궁', nameI18n: { en: 'Gyeongbokgung Palace', 'zh-Hans': '景福宫' }, lat: 37.5796, lng: 126.9770, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000002', entityType: 'PLACE', primaryType: 'MUSEUM', nameKo: '국립중앙박물관', nameI18n: { en: 'National Museum of Korea' }, lat: 37.5240, lng: 126.9804, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000003', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '남산타워', nameI18n: { en: 'Namsan Tower' }, lat: 37.5512, lng: 126.9882, qualityGrade: 'A', source: 'rule', themes: ['NIGHT'] },
      { id: '00000000-0000-0000-0000-000000000004', entityType: 'EVENT', primaryType: 'PERFORMANCE', nameKo: '전통국악공연', nameI18n: { en: 'Traditional Music Performance' }, qualityGrade: 'B', source: 'rule', themes: ['TRADITIONAL_MUSIC'] },
    ],
    busan: [
      { id: '00000000-0000-0000-0000-000000000011', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '해운대 해수욕장', nameI18n: { en: 'Haeundae Beach' }, lat: 35.1587, lng: 129.1604, qualityGrade: 'A', source: 'rule', themes: ['NIGHT'] },
      { id: '00000000-0000-0000-0000-000000000012', entityType: 'PLACE', primaryType: 'RESTAURANT', nameKo: '자갈치시장', nameI18n: { en: 'Jagalchi Market' }, lat: 35.0967, lng: 129.0305, qualityGrade: 'B', source: 'rule', themes: ['FOOD'] },
      { id: '00000000-0000-0000-0000-000000000013', entityType: 'PLACE', primaryType: 'MUSEUM', nameKo: '부산박물관', nameI18n: { en: 'Busan Museum' }, lat: 35.1295, lng: 129.0940, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000014', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '광안리 해변', nameI18n: { en: 'Gwangalli Beach' }, lat: 35.1532, lng: 129.1189, qualityGrade: 'A', source: 'rule', themes: ['NIGHT'] },
      { id: '00000000-0000-0000-0000-000000000015', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '용두산공원', nameI18n: { en: 'Yongdusan Park' }, lat: 35.1006, lng: 129.0326, qualityGrade: 'B', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000016', entityType: 'PLACE', primaryType: 'RESTAURANT', nameKo: '해운대 암소갈비', nameI18n: { en: 'Haeundae Ribs' }, lat: 35.1630, lng: 129.1660, qualityGrade: 'A', source: 'rule', themes: ['FOOD'] },
    ],
    gyeongju: [
      { id: '00000000-0000-0000-0000-000000000021', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '불국사', nameI18n: { en: 'Bulguksa Temple' }, lat: 35.7901, lng: 129.3320, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000022', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '석굴암', nameI18n: { en: 'Seokguram' }, lat: 35.7946, lng: 129.3496, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000023', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '동궁과 월지', nameI18n: { en: 'Donggung and Wolji' }, lat: 35.8340, lng: 129.2268, qualityGrade: 'A', source: 'rule', themes: ['HISTORY', 'NIGHT'] },
      { id: '00000000-0000-0000-0000-000000000024', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '첨성대', nameI18n: { en: 'Cheomseongdae' }, lat: 35.8347, lng: 129.2190, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000025', entityType: 'PLACE', primaryType: 'RESTAURANT', nameKo: '황남빵 본점', nameI18n: { en: 'Hwangnam Bakery' }, lat: 35.8383, lng: 129.2136, qualityGrade: 'A', source: 'rule', themes: ['FOOD'] },
      { id: '00000000-0000-0000-0000-000000000026', entityType: 'PLACE', primaryType: 'MUSEUM', nameKo: '국립경주박물관', nameI18n: { en: 'Gyeongju National Museum' }, lat: 35.8330, lng: 129.2195, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
    ],
    jeonju: [
      { id: '00000000-0000-0000-0000-000000000031', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '전주한옥마을', nameI18n: { en: 'Jeonju Hanok Village' }, lat: 35.8147, lng: 127.1526, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000032', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '경기전', nameI18n: { en: 'Gyeonggijeon Shrine' }, lat: 35.8153, lng: 127.1496, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000033', entityType: 'PLACE', primaryType: 'RESTAURANT', nameKo: '전주비빔밥 맛집', nameI18n: { en: 'Bibimbap Restaurant' }, lat: 35.8140, lng: 127.1510, qualityGrade: 'B', source: 'rule', themes: ['FOOD'] },
      { id: '00000000-0000-0000-0000-000000000034', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '오목대', nameI18n: { en: 'Omokdae' }, lat: 35.8122, lng: 127.1555, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000035', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '전동성당', nameI18n: { en: 'Jeondong Catholic Church' }, lat: 35.8133, lng: 127.1492, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
    ],
    namwon: [
      { id: '00000000-0000-0000-0000-000000000041', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '광한루원', nameI18n: { en: 'Gwanghalluwon' }, lat: 35.4054, lng: 127.3804, qualityGrade: 'A', source: 'rule', themes: ['HISTORY', 'NIGHT'] },
      { id: '00000000-0000-0000-0000-000000000042', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '춘향테마파크', nameI18n: { en: 'Chunhyang Theme Park' }, lat: 35.4020, lng: 127.3870, qualityGrade: 'B', source: 'rule', themes: ['HISTORY', 'FAMILY'] },
      { id: '00000000-0000-0000-0000-000000000043', entityType: 'PLACE', primaryType: 'RESTAURANT', nameKo: '추어탕 거리', nameI18n: { en: 'Chueotang Street' }, lat: 35.4080, lng: 127.3820, qualityGrade: 'A', source: 'rule', themes: ['FOOD'] },
      { id: '00000000-0000-0000-0000-000000000044', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '만복사지', nameI18n: { en: 'Manboksaji' }, lat: 35.4120, lng: 127.3850, qualityGrade: 'B', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000045', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '지리산 국립공원', nameI18n: { en: 'Jirisan National Park' }, lat: 35.3371, lng: 127.7306, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS', 'FAMILY'] },
    ],
  };
  const resolvedCityCode = mockDb[cityCode] ? cityCode : 'seoul';
  return mockDb[resolvedCityCode].map(candidate => ({
    ...candidate,
    cityCode: resolvedCityCode,
  }));
}

async function fetchRuleBasedCandidates(input: RecommendInput): Promise<Candidate[]> {
  const hasSupabase = hasSupabaseConfig();
  
  if (!hasSupabase) {
    // Return city-specific mock data when Supabase is not configured
    return getCityMockData(input.cityCode);
  }
  
  const cityId = await resolveCityId(input.cityCode);
  
  let candidates: Candidate[] = [];
  
  try {
    const { data: places } = await supabaseAdmin
      .from('places')
      .select('place_id, name_ko, lat, lng, primary_type, sub_type, indoor_outdoor, official_url, phone, place_theme_map(theme_id, themes(code)), place_i18n(lang, name)')
      .eq('city_id', cityId);
      
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('event_id, title_ko, official_url, genre, event_i18n(lang, title)')
      .eq('city_id', cityId)
      .eq('status', 'ACTIVE');

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
        cityCode: input.cityCode,
        cityId,
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
        cityCode: input.cityCode,
        cityId,
        primaryType: 'PERFORMANCE',
        nameKo: e.title_ko,
        nameI18n,
        qualityGrade: 'B',
        officialUrl: e.official_url || undefined,
        source: 'rule',
        themes: [mapKopisGenreToTheme(e.genre)],
      });
    });
  } catch (err) {
    console.warn('[Candidates] Supabase query failed, using mock data:', err);
  }

  // If DB returned nothing (empty tables or query error), fall back to city-specific mock data
  if (candidates.length === 0) {
    console.log(`[Candidates] No DB data for ${input.cityCode}, using city-specific mock data`);
    return getCityMockData(input.cityCode);
  }

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

  if (!hasSupabaseConfig()) {
    return dedupeCandidates(ruleBased);
  }
  
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
      
      semanticBased = placesByEmbedding
        .filter((p: any) => cityId === NULL_UUID || p.city_id === cityId)
        .map((p: any) => ({
        id: p.place_id,
        entityType: 'PLACE',
        cityCode: input.cityCode,
        cityId: p.city_id,
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
