import stringSimilarity from 'string-similarity';
import { supabaseAdmin } from '../supabase/admin';
import { NormalizedPlace } from '../sources/_types';

async function resolveCityId(normalized: NormalizedPlace): Promise<string> {
  let cityCode = 'seoul';
  const lookupText = `${normalized.addrKo || ''} ${normalized.nameKo || ''}`;
  const cityKeywords: Array<[string, string[]]> = [
    ['incheon', ['인천', '영종', '차이나타운', 'Incheon', 'Yeongjong']],
    ['suwon', ['수원', 'Suwon']],
    ['sokcho', ['속초', '설악', 'Sokcho', 'Seorak']],
    ['gangneung', ['강릉', '주문진', '경포', 'Gangneung', 'Jumunjin', 'Gyeongpo']],
    ['daejeon', ['대전', 'Daejeon']],
    ['andong', ['안동', '하회', '도산서원', 'Andong', 'Hahoe']],
    ['daegu', ['대구', 'Daegu']],
    ['busan', ['부산', '해운대', '광안리', 'Busan', 'Haeundae', 'Gwangalli']],
    ['gyeongju', ['경주', '불국사', '첨성대', 'Gyeongju', 'Bulguksa']],
    ['ulsan', ['울산', 'Ulsan']],
    ['jeonju', ['전주', 'Jeonju']],
    ['namwon', ['남원', 'Namwon']],
    ['gwangju', ['광주', 'Gwangju']],
    ['mokpo', ['목포', 'Mokpo']],
    ['yeosu', ['여수', 'Yeosu']],
    ['tongyeong', ['통영', 'Tongyeong']],
    ['jeju', ['제주', 'Jeju']],
  ];
  const matchedCity = cityKeywords.find(([, keywords]) =>
    keywords.some(keyword => lookupText.includes(keyword))
  );

  if (matchedCity) {
    cityCode = matchedCity[0];
  }

  const { data } = await supabaseAdmin
    .from('cities')
    .select('city_id')
    .eq('code', cityCode)
    .maybeSingle();

  if (data) return data.city_id;

  const { data: firstCity } = await supabaseAdmin
    .from('cities')
    .select('city_id')
    .limit(1)
    .single();

  return firstCity?.city_id || '00000000-0000-0000-0000-000000000000';
}

export async function findOrCreatePlace(normalized: NormalizedPlace): Promise<string> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[place-normalizer] Supabase credentials missing. Returning dummy place ID.');
    return '00000000-0000-0000-0000-000000000000';
  }

  // 1단계: source_place_id로 정확 매칭
  const { data: existing } = await supabaseAdmin
    .from('place_source_map')
    .select('place_id')
    .eq('source_name', normalized.sourceName)
    .eq('source_place_id', normalized.sourcePlaceId)
    .maybeSingle();
  
  if (existing) return existing.place_id;
  
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
  const cityId = await resolveCityId(normalized);
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
