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
    code: 'busan',
    name: 'Busan',
    nameKo: '부산',
    lat: 35.1796,
    lng: 129.0756,
    mapX: 78,
    mapY: 75,
    hubLabel: 'Southeast Coast',
  },
  {
    code: 'gyeongju',
    name: 'Gyeongju',
    nameKo: '경주',
    lat: 35.8562,
    lng: 129.2132,
    mapX: 70,
    mapY: 61,
    hubLabel: 'Heritage Belt',
  },
  {
    code: 'jeonju',
    name: 'Jeonju',
    nameKo: '전주',
    lat: 35.8242,
    lng: 127.1480,
    mapX: 42,
    mapY: 61,
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
] as const;

export type CityCode = (typeof CITY_OPTIONS)[number]['code'];

export const DEFAULT_CITY_CODE: CityCode = 'seoul';

const CITY_CODE_SET = new Set<string>(CITY_OPTIONS.map(city => city.code));

export function isCityCode(value?: string | null): value is CityCode {
  return Boolean(value && CITY_CODE_SET.has(value));
}

export function normalizeCityCode(value?: string | null): CityCode {
  const normalized = value?.toLowerCase();
  return isCityCode(normalized) ? normalized : DEFAULT_CITY_CODE;
}

export function normalizeCityCodes(cityCode?: string | null, cityCodes?: Array<string | null | undefined>): CityCode[] {
  const rawCodes = cityCodes && cityCodes.length > 0 ? cityCodes : [cityCode];
  const normalized = rawCodes
    .map(code => normalizeCityCode(code))
    .filter((code, index, array) => array.indexOf(code) === index);

  return normalized.length > 0 ? normalized : [DEFAULT_CITY_CODE];
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
