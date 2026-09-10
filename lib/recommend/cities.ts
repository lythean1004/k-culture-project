export const CITY_OPTIONS = [
  {
    code: 'seoul',
    name: 'Seoul',
    nameKo: '서울',
    lat: 37.5665,
    lng: 126.9780,
    mapX: 48,
    mapY: 18,
    hubLabel: 'Capital Hub',
  },
  {
    code: 'incheon',
    name: 'Incheon',
    nameKo: '인천',
    lat: 37.4563,
    lng: 126.7052,
    mapX: 38,
    mapY: 22,
    hubLabel: 'Gateway Coast',
  },
  {
    code: 'suwon',
    name: 'Suwon',
    nameKo: '수원',
    lat: 37.2636,
    lng: 127.0286,
    mapX: 48,
    mapY: 29,
    hubLabel: 'Fortress City',
  },
  {
    code: 'sokcho',
    name: 'Sokcho',
    nameKo: '속초',
    lat: 38.2044,
    lng: 128.5912,
    mapX: 73,
    mapY: 16,
    hubLabel: 'Seoraksan Coast',
  },
  {
    code: 'gangneung',
    name: 'Gangneung',
    nameKo: '강릉',
    lat: 37.7519,
    lng: 128.8761,
    mapX: 76,
    mapY: 26,
    hubLabel: 'Surf and Coffee',
  },
  {
    code: 'daejeon',
    name: 'Daejeon',
    nameKo: '대전',
    lat: 36.3504,
    lng: 127.3845,
    mapX: 52,
    mapY: 45,
    hubLabel: 'Science Hub',
  },
  {
    code: 'andong',
    name: 'Andong',
    nameKo: '안동',
    lat: 36.5684,
    lng: 128.7294,
    mapX: 68,
    mapY: 48,
    hubLabel: 'Confucian Heritage',
  },
  {
    code: 'daegu',
    name: 'Daegu',
    nameKo: '대구',
    lat: 35.8714,
    lng: 128.6014,
    mapX: 65,
    mapY: 60,
    hubLabel: 'Market and Alleys',
  },
  {
    code: 'busan',
    name: 'Busan',
    nameKo: '부산',
    lat: 35.1796,
    lng: 129.0756,
    mapX: 79,
    mapY: 75,
    hubLabel: 'Southeast Coast',
  },
  {
    code: 'gyeongju',
    name: 'Gyeongju',
    nameKo: '경주',
    lat: 35.8562,
    lng: 129.2132,
    mapX: 76,
    mapY: 62,
    hubLabel: 'Heritage Belt',
  },
  {
    code: 'ulsan',
    name: 'Ulsan',
    nameKo: '울산',
    lat: 35.5384,
    lng: 129.3114,
    mapX: 82,
    mapY: 67,
    hubLabel: 'Industrial Coast',
  },
  {
    code: 'jeonju',
    name: 'Jeonju',
    nameKo: '전주',
    lat: 35.8242,
    lng: 127.1480,
    mapX: 43,
    mapY: 60,
    hubLabel: 'Food and Hanok',
  },
  {
    code: 'namwon',
    name: 'Namwon',
    nameKo: '남원',
    lat: 35.4164,
    lng: 127.3904,
    mapX: 48,
    mapY: 74,
    hubLabel: 'Story Route',
  },
  {
    code: 'gwangju',
    name: 'Gwangju',
    nameKo: '광주',
    lat: 35.1595,
    lng: 126.8526,
    mapX: 40,
    mapY: 73,
    hubLabel: 'Art and Democracy',
  },
  {
    code: 'mokpo',
    name: 'Mokpo',
    nameKo: '목포',
    lat: 34.8118,
    lng: 126.3922,
    mapX: 34,
    mapY: 83,
    hubLabel: 'Harbor History',
  },
  {
    code: 'yeosu',
    name: 'Yeosu',
    nameKo: '여수',
    lat: 34.7604,
    lng: 127.6622,
    mapX: 53,
    mapY: 84,
    hubLabel: 'Night Sea',
  },
  {
    code: 'tongyeong',
    name: 'Tongyeong',
    nameKo: '통영',
    lat: 34.8544,
    lng: 128.4332,
    mapX: 65,
    mapY: 82,
    hubLabel: 'Islands and Arts',
  },
  {
    code: 'jeju',
    name: 'Jeju',
    nameKo: '제주',
    lat: 33.4996,
    lng: 126.5312,
    mapX: 40,
    mapY: 93,
    hubLabel: 'Island Tourism',
  },
] as const;

export type CityCode = (typeof CITY_OPTIONS)[number]['code'];

export const DEFAULT_CITY_CODE: CityCode = 'seoul';
export const CITY_CODE_VALUES = CITY_OPTIONS.map(city => city.code) as [CityCode, ...CityCode[]];

const CITY_CODE_SET = new Set<string>(CITY_OPTIONS.map(city => city.code));

export function isCityCode(value?: string | null): value is CityCode {
  return Boolean(value && CITY_CODE_SET.has(value));
}

export function normalizeCityCode(value?: string | null): CityCode {
  const normalized = value?.trim().toLowerCase();
  return isCityCode(normalized) ? normalized : DEFAULT_CITY_CODE;
}

export function normalizeCityCodes(cityCode?: string | null, cityCodes?: Array<string | null | undefined>): CityCode[] {
  const rawCodes = cityCodes && cityCodes.length > 0 ? cityCodes : [cityCode];
  const normalized = rawCodes
    .map(code => code?.trim().toLowerCase())
    .filter(isCityCode)
    .filter((code, index, array) => array.indexOf(code) === index);

  return normalized.length > 0 ? normalized : [normalizeCityCode(cityCode)];
}

export function getCityOption(code: string) {
  return CITY_OPTIONS.find(city => city.code === code) || CITY_OPTIONS[0];
}

export function formatCityScope(cityCodes: string[]): string {
  return normalizeCityCodes(undefined, cityCodes)
    .map(code => getCityOption(code).name)
    .join(' + ');
}

export function formatCityScopeKo(cityCodes: string[]): string {
  return normalizeCityCodes(undefined, cityCodes)
    .map(code => getCityOption(code).nameKo)
    .join(' + ');
}

export function cityScopeSlug(cityCodes: string[]): string {
  const normalized = normalizeCityCodes(undefined, cityCodes);
  return normalized.length > 1 ? `multi-${normalized.join('-')}` : normalized[0];
}

export function dayCountFromVisitForm(visitForm: 'DAY_TRIP' | 'STAY_1_3' | 'THEME_TOUR', requestedDays?: number): 1 | 2 | 3 {
  if (requestedDays === 1) return 1;
  if (requestedDays === 2 || requestedDays === 3) return requestedDays;
  if (visitForm === 'STAY_1_3') return 2;
  if (visitForm === 'THEME_TOUR') return 3;
  return 1;
}

export function visitFormFromDayCount(dayCount: number): 'DAY_TRIP' | 'STAY_1_3' | 'THEME_TOUR' {
  if (dayCount >= 3) return 'THEME_TOUR';
  if (dayCount === 2) return 'STAY_1_3';
  return 'DAY_TRIP';
}
