import stringSimilarity from 'string-similarity';
import { supabaseAdmin } from '../supabase/admin';
import { NormalizedPlace } from '../sources/_types';
import { cityFromAddress, coordinateFitsCity } from '../recommend/geography';

async function resolveCityId(normalized: NormalizedPlace): Promise<string> {
  const cityCode = cityFromAddress(normalized.addrKo);

  if (!cityCode) throw new Error('Place address does not identify a supported city');
  if (normalized.lat !== undefined && normalized.lng !== undefined && !coordinateFitsCity(cityCode, normalized.lat, normalized.lng)) {
    throw new Error('Place coordinates conflict with its administrative address');
  }

  const { data } = await supabaseAdmin
    .from('cities')
    .select('city_id')
    .eq('code', cityCode)
    .maybeSingle();

  if (data) return data.city_id;

  throw new Error(`City ${cityCode} is missing from the database; apply city seeds`);
}

export async function findOrCreatePlace(normalized: NormalizedPlace): Promise<string> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[place-normalizer] Supabase credentials missing. Returning dummy place ID.');
    return '00000000-0000-0000-0000-000000000000';
  }

  const cityId = await resolveCityId(normalized);
  // 1단계: source_place_id로 정확 매칭
  const { data: existing } = await supabaseAdmin
    .from('place_source_map')
    .select('place_id')
    .eq('source_name', normalized.sourceName)
    .eq('source_place_id', normalized.sourcePlaceId)
    .maybeSingle();
  
  if (existing) {
    const { error } = await supabaseAdmin.from('places').update({ city_id: cityId }).eq('place_id', existing.place_id);
    if (error) throw new Error(`Failed to correct place city: ${error.code}`);
    return existing.place_id;
  }
  
  // 2단계: 좌표 + 이름 유사도 매칭 (다른 소스의 동일 장소)
  if (normalized.lat && normalized.lng && normalized.nameKo) {
    const { data: candidates } = await supabaseAdmin.rpc('find_nearby_places', {
      target_lat: normalized.lat,
      target_lng: normalized.lng,
      radius_m: 50,
    });
    
    for (const c of candidates ?? []) {
      const sim = stringSimilarity.compareTwoStrings(
        normalized.nameKo.toLowerCase(),
        c.name_ko.toLowerCase()
      );
      if (sim > 0.8) {
        // 기존 장소에 매핑 추가
        await supabaseAdmin.from('place_source_map').insert({
          place_id: c.place_id,
          source_name: normalized.sourceName,
          source_place_id: normalized.sourcePlaceId,
          raw_json: normalized.rawJson,
        });
        return c.place_id;
      }
    }
  }
  
  // 3단계: 신규 생성
  const { data: newPlace, error: insertError } = await supabaseAdmin
    .from('places')
    .insert({
      city_id: cityId,
      primary_type: normalized.primaryType,
      sub_type: normalized.subType || null,
      name_ko: normalized.nameKo ?? normalized.nameI18n?.[0]?.name ?? 'Unnamed',
      addr_ko: normalized.addrKo || null,
      lat: normalized.lat || null,
      lng: normalized.lng || null,
      geom: normalized.lat && normalized.lng 
        ? `POINT(${normalized.lng} ${normalized.lat})` 
        : null,
      indoor_outdoor: normalized.indoorOutdoor ?? 'INDOOR',
      official_url: normalized.officialUrl || null,
      phone: normalized.phone || null,
      source_confidence: 0.7,
    })
    .select('place_id')
    .single();
  
  if (insertError || !newPlace) {
    throw new Error(`Failed to insert new place: ${insertError?.message || 'Unknown place insertion error'}`);
  }
  
  await supabaseAdmin.from('place_source_map').insert({
    place_id: newPlace.place_id,
    source_name: normalized.sourceName,
    source_place_id: normalized.sourcePlaceId,
    raw_json: normalized.rawJson,
  });
  
  // i18n 텍스트 적재
  if (normalized.nameI18n && normalized.nameI18n.length > 0) {
    await supabaseAdmin.from('place_i18n').upsert(
      normalized.nameI18n.map(i => ({
        place_id: newPlace.place_id,
        lang: i.lang,
        name: i.name,
        short_desc: i.shortDesc || null,
        long_desc: i.longDesc || null,
        translation_source: 'OFFICIAL_HUMAN',
        quality_grade: 'B',
      }))
    );
  }
  
  return newPlace.place_id;
}
