import { supabaseAdmin } from '../supabase/admin';
import { embedWithCache } from '../ai/embedding/cache';
import { searchSimilarPlaces } from '../ai/embedding/search';
import { Candidate, RecommendInput, ThemeCode } from './types';
import { CityCode, isCityCode, normalizeCityCodes } from './cities';
import { cityFromAddress, coordinateFitsCity } from './geography';

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

async function resolveCityIds(cityCodes: string[]): Promise<Map<CityCode, string>> {
  const resolved = new Map<CityCode, string>();

  for (const cityCode of normalizeCityCodes(undefined, cityCodes)) {
    const cityId = await resolveCityId(cityCode);
    if (cityId !== NULL_UUID) {
      resolved.set(cityCode, cityId);
    }
  }

  return resolved;
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
  const mockDb: Record<CityCode, Candidate[]> = {
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
    incheon: [
      { id: '00000000-0000-0000-0000-000000000051', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '인천 차이나타운', nameI18n: { en: 'Incheon Chinatown' }, lat: 37.4753, lng: 126.6196, qualityGrade: 'A', source: 'rule', themes: ['FOOD', 'HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000052', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '월미도', nameI18n: { en: 'Wolmido Island' }, lat: 37.4712, lng: 126.5966, qualityGrade: 'A', source: 'rule', themes: ['NIGHT', 'FAMILY'] },
      { id: '00000000-0000-0000-0000-000000000053', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '영종도 마시안해변', nameI18n: { en: 'Masian Beach, Yeongjongdo' }, lat: 37.4256, lng: 126.4143, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS', 'NIGHT'] },
      { id: '00000000-0000-0000-0000-000000000054', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '인천개항장 문화지구', nameI18n: { en: 'Incheon Open Port Culture District' }, lat: 37.4738, lng: 126.6216, qualityGrade: 'A', source: 'rule', themes: ['HISTORY', 'MODERN_ART'] },
      { id: '00000000-0000-0000-0000-000000000055', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '송도 센트럴파크', nameI18n: { en: 'Songdo Central Park' }, lat: 37.3927, lng: 126.6374, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS', 'FAMILY'] },
    ],
    suwon: [
      { id: '00000000-0000-0000-0000-000000000061', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '수원화성', nameI18n: { en: 'Hwaseong Fortress' }, lat: 37.2879, lng: 127.0131, qualityGrade: 'A', source: 'rule', themes: ['HISTORY', 'FAMILY'] },
      { id: '00000000-0000-0000-0000-000000000062', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '화성행궁', nameI18n: { en: 'Hwaseong Haenggung Palace' }, lat: 37.2819, lng: 127.0142, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000063', entityType: 'PLACE', primaryType: 'RESTAURANT', nameKo: '수원통닭거리', nameI18n: { en: 'Suwon Chicken Street' }, lat: 37.2753, lng: 127.0188, qualityGrade: 'B', source: 'rule', themes: ['FOOD'] },
      { id: '00000000-0000-0000-0000-000000000064', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '광교호수공원', nameI18n: { en: 'Gwanggyo Lake Park' }, lat: 37.2839, lng: 127.0610, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS', 'NIGHT'] },
      { id: '00000000-0000-0000-0000-000000000065', entityType: 'PLACE', primaryType: 'ART_GALLERY', nameKo: '수원시립아이파크미술관', nameI18n: { en: 'Suwon Ipark Museum of Art' }, lat: 37.2824, lng: 127.0157, qualityGrade: 'A', source: 'rule', themes: ['MODERN_ART'] },
    ],
    sokcho: [
      { id: '00000000-0000-0000-0000-000000000071', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '설악산국립공원', nameI18n: { en: 'Seoraksan National Park' }, lat: 38.1194, lng: 128.4656, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS', 'FAMILY'] },
      { id: '00000000-0000-0000-0000-000000000072', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '속초해수욕장', nameI18n: { en: 'Sokcho Beach' }, lat: 38.1907, lng: 128.6035, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS', 'NIGHT'] },
      { id: '00000000-0000-0000-0000-000000000073', entityType: 'PLACE', primaryType: 'RESTAURANT', nameKo: '속초관광수산시장', nameI18n: { en: 'Sokcho Tourist and Fishery Market' }, lat: 38.2031, lng: 128.5905, qualityGrade: 'A', source: 'rule', themes: ['FOOD'] },
      { id: '00000000-0000-0000-0000-000000000074', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '아바이마을', nameI18n: { en: 'Abai Village' }, lat: 38.2016, lng: 128.5967, qualityGrade: 'B', source: 'rule', themes: ['HISTORY', 'FOOD'] },
      { id: '00000000-0000-0000-0000-000000000075', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '영랑호', nameI18n: { en: 'Yeongnangho Lake' }, lat: 38.2170, lng: 128.5839, qualityGrade: 'B', source: 'rule', themes: ['WELLNESS'] },
    ],
    gangneung: [
      { id: '00000000-0000-0000-0000-000000000081', entityType: 'PLACE', primaryType: 'RESTAURANT', nameKo: '안목해변 커피거리', nameI18n: { en: 'Anmok Beach Coffee Street' }, lat: 37.7718, lng: 128.9477, qualityGrade: 'A', source: 'rule', themes: ['FOOD', 'NIGHT'] },
      { id: '00000000-0000-0000-0000-000000000082', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '주문진 해변', nameI18n: { en: 'Jumunjin Beach' }, lat: 37.9115, lng: 128.8208, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS'] },
      { id: '00000000-0000-0000-0000-000000000083', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '오죽헌', nameI18n: { en: 'Ojukheon' }, lat: 37.7794, lng: 128.8783, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000084', entityType: 'PLACE', primaryType: 'ART_GALLERY', nameKo: '강릉아트센터', nameI18n: { en: 'Gangneung Arts Center' }, lat: 37.7584, lng: 128.8900, qualityGrade: 'B', source: 'rule', themes: ['MODERN_ART'] },
      { id: '00000000-0000-0000-0000-000000000085', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '경포호', nameI18n: { en: 'Gyeongpo Lake' }, lat: 37.7953, lng: 128.9027, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS', 'FAMILY'] },
    ],
    daejeon: [
      { id: '00000000-0000-0000-0000-000000000091', entityType: 'PLACE', primaryType: 'MUSEUM', nameKo: '국립중앙과학관', nameI18n: { en: 'National Science Museum' }, lat: 36.3767, lng: 127.3750, qualityGrade: 'A', source: 'rule', themes: ['FAMILY', 'MODERN_ART'] },
      { id: '00000000-0000-0000-0000-000000000092', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '한밭수목원', nameI18n: { en: 'Hanbat Arboretum' }, lat: 36.3683, lng: 127.3880, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS', 'FAMILY'] },
      { id: '00000000-0000-0000-0000-000000000093', entityType: 'PLACE', primaryType: 'MUSEUM', nameKo: '대전근현대사전시관', nameI18n: { en: 'Daejeon Modern History Exhibition Hall' }, lat: 36.3292, lng: 127.4213, qualityGrade: 'B', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000094', entityType: 'PLACE', primaryType: 'RESTAURANT', nameKo: '성심당 본점', nameI18n: { en: 'Sungsimdang Main Store' }, lat: 36.3279, lng: 127.4278, qualityGrade: 'A', source: 'rule', themes: ['FOOD'] },
      { id: '00000000-0000-0000-0000-000000000095', entityType: 'PLACE', primaryType: 'ART_GALLERY', nameKo: '대전예술의전당', nameI18n: { en: 'Daejeon Arts Center' }, lat: 36.3665, lng: 127.3874, qualityGrade: 'B', source: 'rule', themes: ['MODERN_ART', 'FESTIVAL'] },
    ],
    andong: [
      { id: '00000000-0000-0000-0000-000000000101', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '하회마을', nameI18n: { en: 'Hahoe Folk Village' }, lat: 36.5391, lng: 128.5183, qualityGrade: 'A', source: 'rule', themes: ['HISTORY', 'FAMILY'] },
      { id: '00000000-0000-0000-0000-000000000102', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '도산서원', nameI18n: { en: 'Dosan Seowon' }, lat: 36.7274, lng: 128.8433, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000103', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '월영교', nameI18n: { en: 'Woryeonggyo Bridge' }, lat: 36.5767, lng: 128.7601, qualityGrade: 'A', source: 'rule', themes: ['NIGHT', 'WELLNESS'] },
      { id: '00000000-0000-0000-0000-000000000104', entityType: 'PLACE', primaryType: 'RESTAURANT', nameKo: '안동구시장', nameI18n: { en: 'Andong Old Market' }, lat: 36.5651, lng: 128.7328, qualityGrade: 'B', source: 'rule', themes: ['FOOD'] },
      { id: '00000000-0000-0000-0000-000000000105', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '안동탈춤공원', nameI18n: { en: 'Andong Maskdance Park' }, lat: 36.5625, lng: 128.7306, qualityGrade: 'B', source: 'rule', themes: ['FESTIVAL', 'FAMILY'] },
    ],
    daegu: [
      { id: '00000000-0000-0000-0000-000000000111', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '대구 근대골목', nameI18n: { en: 'Daegu Modern History Streets' }, lat: 35.8696, lng: 128.5907, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000112', entityType: 'PLACE', primaryType: 'RESTAURANT', nameKo: '서문시장', nameI18n: { en: 'Seomun Market' }, lat: 35.8691, lng: 128.5808, qualityGrade: 'A', source: 'rule', themes: ['FOOD', 'NIGHT'] },
      { id: '00000000-0000-0000-0000-000000000113', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '앞산전망대', nameI18n: { en: 'Apsan Observatory' }, lat: 35.8321, lng: 128.5886, qualityGrade: 'A', source: 'rule', themes: ['NIGHT', 'WELLNESS'] },
      { id: '00000000-0000-0000-0000-000000000114', entityType: 'PLACE', primaryType: 'ART_GALLERY', nameKo: '대구미술관', nameI18n: { en: 'Daegu Art Museum' }, lat: 35.8276, lng: 128.6745, qualityGrade: 'A', source: 'rule', themes: ['MODERN_ART'] },
      { id: '00000000-0000-0000-0000-000000000115', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '김광석 다시그리기길', nameI18n: { en: 'Kim Kwangseok-gil Street' }, lat: 35.8589, lng: 128.6065, qualityGrade: 'B', source: 'rule', themes: ['MODERN_ART', 'NIGHT'] },
    ],
    ulsan: [
      { id: '00000000-0000-0000-0000-000000000121', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '태화강 국가정원', nameI18n: { en: 'Taehwagang National Garden' }, lat: 35.5486, lng: 129.2967, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS', 'FAMILY'] },
      { id: '00000000-0000-0000-0000-000000000122', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '대왕암공원', nameI18n: { en: 'Daewangam Park' }, lat: 35.4915, lng: 129.4354, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS', 'HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000123', entityType: 'PLACE', primaryType: 'MUSEUM', nameKo: '장생포고래문화마을', nameI18n: { en: 'Jangsaengpo Whale Culture Village' }, lat: 35.5032, lng: 129.3796, qualityGrade: 'B', source: 'rule', themes: ['FAMILY', 'HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000124', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '간절곶', nameI18n: { en: 'Ganjeolgot Cape' }, lat: 35.3601, lng: 129.3605, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS'] },
      { id: '00000000-0000-0000-0000-000000000125', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '울산대공원', nameI18n: { en: 'Ulsan Grand Park' }, lat: 35.5311, lng: 129.2921, qualityGrade: 'B', source: 'rule', themes: ['FAMILY', 'WELLNESS'] },
    ],
    gwangju: [
      { id: '00000000-0000-0000-0000-000000000131', entityType: 'PLACE', primaryType: 'ART_GALLERY', nameKo: '국립아시아문화전당', nameI18n: { en: 'Asia Culture Center' }, lat: 35.1469, lng: 126.9198, qualityGrade: 'A', source: 'rule', themes: ['MODERN_ART', 'FESTIVAL'] },
      { id: '00000000-0000-0000-0000-000000000132', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '양림동 역사문화마을', nameI18n: { en: 'Yangnim-dong History and Culture Village' }, lat: 35.1398, lng: 126.9139, qualityGrade: 'A', source: 'rule', themes: ['HISTORY', 'MODERN_ART'] },
      { id: '00000000-0000-0000-0000-000000000133', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '무등산', nameI18n: { en: 'Mudeungsan Mountain' }, lat: 35.1342, lng: 127.0026, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS'] },
      { id: '00000000-0000-0000-0000-000000000134', entityType: 'PLACE', primaryType: 'RESTAURANT', nameKo: '1913송정역시장', nameI18n: { en: '1913 Songjeong Station Market' }, lat: 35.1377, lng: 126.7913, qualityGrade: 'B', source: 'rule', themes: ['FOOD', 'NIGHT'] },
      { id: '00000000-0000-0000-0000-000000000135', entityType: 'PLACE', primaryType: 'ART_GALLERY', nameKo: '광주비엔날레전시관', nameI18n: { en: 'Gwangju Biennale Exhibition Hall' }, lat: 35.1845, lng: 126.8906, qualityGrade: 'A', source: 'rule', themes: ['MODERN_ART'] },
    ],
    mokpo: [
      { id: '00000000-0000-0000-0000-000000000141', entityType: 'PLACE', primaryType: 'MUSEUM', nameKo: '목포근대역사관', nameI18n: { en: 'Mokpo Modern History Museum' }, lat: 34.7885, lng: 126.3815, qualityGrade: 'A', source: 'rule', themes: ['HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000142', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '갓바위', nameI18n: { en: 'Gatbawi Rock' }, lat: 34.7919, lng: 126.4252, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS', 'FAMILY'] },
      { id: '00000000-0000-0000-0000-000000000143', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '목포해상케이블카', nameI18n: { en: 'Mokpo Marine Cable Car' }, lat: 34.7926, lng: 126.3715, qualityGrade: 'A', source: 'rule', themes: ['NIGHT', 'FAMILY'] },
      { id: '00000000-0000-0000-0000-000000000144', entityType: 'PLACE', primaryType: 'RESTAURANT', nameKo: '목포자유시장', nameI18n: { en: 'Mokpo Jayu Market' }, lat: 34.8011, lng: 126.3914, qualityGrade: 'B', source: 'rule', themes: ['FOOD'] },
      { id: '00000000-0000-0000-0000-000000000145', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '유달산', nameI18n: { en: 'Yudalsan Mountain' }, lat: 34.7914, lng: 126.3769, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS', 'HISTORY'] },
    ],
    yeosu: [
      { id: '00000000-0000-0000-0000-000000000151', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '여수밤바다', nameI18n: { en: 'Yeosu Night Sea' }, lat: 34.7394, lng: 127.7362, qualityGrade: 'A', source: 'rule', themes: ['NIGHT'] },
      { id: '00000000-0000-0000-0000-000000000152', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '오동도', nameI18n: { en: 'Odongdo Island' }, lat: 34.7448, lng: 127.7668, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS', 'FAMILY'] },
      { id: '00000000-0000-0000-0000-000000000153', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '향일암', nameI18n: { en: 'Hyangiram Hermitage' }, lat: 34.5940, lng: 127.8020, qualityGrade: 'A', source: 'rule', themes: ['HISTORY', 'WELLNESS'] },
      { id: '00000000-0000-0000-0000-000000000154', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '여수해상케이블카', nameI18n: { en: 'Yeosu Maritime Cable Car' }, lat: 34.7317, lng: 127.7485, qualityGrade: 'A', source: 'rule', themes: ['NIGHT', 'FAMILY'] },
      { id: '00000000-0000-0000-0000-000000000155', entityType: 'PLACE', primaryType: 'RESTAURANT', nameKo: '낭만포차거리', nameI18n: { en: 'Romantic Pocha Street' }, lat: 34.7407, lng: 127.7366, qualityGrade: 'B', source: 'rule', themes: ['FOOD', 'NIGHT'] },
    ],
    tongyeong: [
      { id: '00000000-0000-0000-0000-000000000161', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '동피랑벽화마을', nameI18n: { en: 'Dongpirang Mural Village' }, lat: 34.8448, lng: 128.4256, qualityGrade: 'A', source: 'rule', themes: ['MODERN_ART', 'FAMILY'] },
      { id: '00000000-0000-0000-0000-000000000162', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '통영케이블카', nameI18n: { en: 'Tongyeong Cable Car' }, lat: 34.8345, lng: 128.4275, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS', 'FAMILY'] },
      { id: '00000000-0000-0000-0000-000000000163', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '이순신공원', nameI18n: { en: 'Yi Sun-sin Park' }, lat: 34.8395, lng: 128.4527, qualityGrade: 'A', source: 'rule', themes: ['HISTORY', 'WELLNESS'] },
      { id: '00000000-0000-0000-0000-000000000164', entityType: 'PLACE', primaryType: 'RESTAURANT', nameKo: '통영중앙시장', nameI18n: { en: 'Tongyeong Jungang Market' }, lat: 34.8440, lng: 128.4251, qualityGrade: 'B', source: 'rule', themes: ['FOOD'] },
      { id: '00000000-0000-0000-0000-000000000165', entityType: 'PLACE', primaryType: 'ART_GALLERY', nameKo: '통영국제음악당', nameI18n: { en: 'Tongyeong Concert Hall' }, lat: 34.8311, lng: 128.4345, qualityGrade: 'A', source: 'rule', themes: ['MODERN_ART', 'FESTIVAL'] },
    ],
    jeju: [
      { id: '00000000-0000-0000-0000-000000000171', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '성산일출봉', nameI18n: { en: 'Seongsan Ilchulbong' }, lat: 33.4581, lng: 126.9425, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS', 'HISTORY'] },
      { id: '00000000-0000-0000-0000-000000000172', entityType: 'PLACE', primaryType: 'MUSEUM', nameKo: '제주민속촌', nameI18n: { en: 'Jeju Folk Village' }, lat: 33.3221, lng: 126.8432, qualityGrade: 'A', source: 'rule', themes: ['HISTORY', 'FAMILY'] },
      { id: '00000000-0000-0000-0000-000000000173', entityType: 'PLACE', primaryType: 'RESTAURANT', nameKo: '동문시장', nameI18n: { en: 'Dongmun Market' }, lat: 33.5117, lng: 126.5260, qualityGrade: 'A', source: 'rule', themes: ['FOOD'] },
      { id: '00000000-0000-0000-0000-000000000174', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '한라산', nameI18n: { en: 'Hallasan Mountain' }, lat: 33.3617, lng: 126.5292, qualityGrade: 'A', source: 'rule', themes: ['WELLNESS'] },
      { id: '00000000-0000-0000-0000-000000000175', entityType: 'PLACE', primaryType: 'ART_GALLERY', nameKo: '아르떼뮤지엄 제주', nameI18n: { en: 'Arte Museum Jeju' }, lat: 33.3960, lng: 126.3445, qualityGrade: 'A', source: 'rule', themes: ['MODERN_ART', 'FAMILY'] },
      { id: '00000000-0000-0000-0000-000000000176', entityType: 'PLACE', primaryType: 'ATTRACTION', nameKo: '함덕해수욕장', nameI18n: { en: 'Hamdeok Beach' }, lat: 33.5431, lng: 126.6697, qualityGrade: 'A', source: 'rule', themes: ['NIGHT', 'WELLNESS'] },
    ],
  };
  const resolvedCityCode = isCityCode(cityCode) ? cityCode : undefined;
  if (!resolvedCityCode) {
    return [];
  }

  return mockDb[resolvedCityCode].map(candidate => ({
    ...candidate,
    cityCode: resolvedCityCode,
    source: 'mock',
  }));
}

async function fetchRuleBasedCandidates(input: RecommendInput): Promise<Candidate[]> {
  const hasSupabase = hasSupabaseConfig();
  const selectedCityCodes = normalizeCityCodes(input.cityCode, input.cityCodes);
  
  if (!hasSupabase) {
    return selectedCityCodes.flatMap(cityCode => getCityMockData(cityCode));
  }
  
  const cityIdsByCode = await resolveCityIds(selectedCityCodes);
  const cityIdToCode = new Map(Array.from(cityIdsByCode.entries()).map(([code, id]) => [id, code]));
  const cityIds = Array.from(cityIdsByCode.values());

  if (cityIds.length === 0) {
    return selectedCityCodes.flatMap(cityCode => getCityMockData(cityCode));
  }
  
  let candidates: Candidate[] = [];
  
  try {
    const { data: places, error: placesError } = await supabaseAdmin
      .from('places')
      .select('*, place_theme_map(theme_id, themes(code)), place_i18n(lang, name)')
      .in('city_id', cityIds);
      
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('event_id, city_id, title_ko, official_url, genre, event_i18n(lang, title), event_sessions(start_at, end_at)')
      .in('city_id', cityIds)
      .eq('status', 'ACTIVE');

    if (placesError) console.warn('[Candidates] Places query failed:', placesError.code);
    if (eventsError) console.warn('[Candidates] Events query failed:', eventsError.code);
    places?.forEach((p: any) => {
      const code = cityIdToCode.get(p.city_id);
      const addressCity = cityFromAddress(p.addr_ko || p.address);
      if (!code || (addressCity && addressCity !== code) || !coordinateFitsCity(code, Number(p.lat), Number(p.lng))) return;
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
        cityCode: cityIdToCode.get(p.city_id) || input.cityCode,
        cityId: p.city_id,
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
      if (!cityIdToCode.has(e.city_id)) return;
      // Do not offer stale or undated seed events as bookable itinerary stops.
      if (!e.event_sessions?.some((session: any) => new Date(session.end_at || session.start_at).getTime() >= Date.now())) return;
      const nameI18n: Record<string, string> = {};
      if (Array.isArray(e.event_i18n)) {
        e.event_i18n.forEach((item: any) => {
          nameI18n[item.lang] = item.title;
        });
      }

      candidates.push({
        id: e.event_id,
        entityType: 'EVENT',
        cityCode: cityIdToCode.get(e.city_id) || input.cityCode,
        cityId: e.city_id,
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

  const coveredCityCodes = new Set(candidates.filter(candidate => candidate.entityType === 'PLACE').map(candidate => candidate.cityCode).filter(Boolean));
  const missingCityCodes = selectedCityCodes.filter(cityCode => !coveredCityCodes.has(cityCode));

  if (missingCityCodes.length > 0) {
    console.log(`[Candidates] No DB data for ${missingCityCodes.join(', ')}, using city-specific mock data`);
    candidates = [
      ...candidates,
      ...missingCityCodes.flatMap(cityCode => getCityMockData(cityCode)),
    ];
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
      const selectedCityCodes = normalizeCityCodes(input.cityCode, input.cityCodes);
      const queryText = [
        ...input.interests.map(i => mapThemeToText(i, input.lang)),
        input.freeTextQuery ?? '',
      ].filter(Boolean).join(' ');
      
      const queryVector = await embedWithCache(queryText, 'query');
      const cityIdsByCode = await resolveCityIds(selectedCityCodes);

      const semanticResults = await Promise.all(
        Array.from(cityIdsByCode.entries()).map(async ([cityCode, cityId]) => {
          const placesByEmbedding = await searchSimilarPlaces({
            queryVector,
            cityId,
            lang: input.lang,
            limit: 80,
          });

          return placesByEmbedding
            .filter((p: any) => p.city_id === cityId)
            .map((p: any) => ({
              id: p.place_id,
              entityType: 'PLACE' as const,
              cityCode,
              cityId: p.city_id,
              primaryType: p.primary_type,
              nameKo: p.name,
              nameI18n: { [input.lang]: p.name },
              lat: p.lat,
              lng: p.lng,
              qualityGrade: 'A' as const,
              source: 'semantic',
              semanticSimilarity: p.similarity,
              themes: input.interests,
            }));
        })
      );

      semanticBased = semanticResults.flat();
    } catch (e) {
      console.warn('Semantic search failed, using rule-based only', e);
    }
  }
  
  // 3) Merge and Dedupe
  return dedupeCandidates([...ruleBased, ...semanticBased]);
}
