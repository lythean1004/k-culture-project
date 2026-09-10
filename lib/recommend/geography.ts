import { CITY_OPTIONS, CityCode } from './cities';

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const radians = Math.PI / 180;
  const dLat = (b.lat - a.lat) * radians;
  const dLng = (b.lng - a.lng) * radians;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Administrative address takes precedence over names (e.g. a Busan Chinatown).
export function cityFromAddress(address?: string): CityCode | undefined {
  const text = address?.trim().toLowerCase();
  if (!text) return undefined;
  if (/경기도?\s*광주|gwangju.*gyeonggi|gyeonggi.*gwangju/.test(text)) return undefined;
  if (/제주|서귀포|jeju|seogwipo/.test(text)) return 'jeju';
  return CITY_OPTIONS.find(city => new RegExp(`(?:^|[\\s,])${city.nameKo}(?:특별자치시|특별시|광역시|시)?(?=$|[\\s,])`).test(text) || new RegExp(`(?:^|[\\s,])${city.code}(?:-si)?(?=$|[\\s,])`, 'i').test(text))?.code;
}

export function coordinateFitsCity(code: string, lat?: number, lng?: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  const city = CITY_OPTIONS.find(item => item.code === code);
  if (!city) return false;
  if (code === 'jeju') return lat! >= 33.1 && lat! <= 33.65 && lng! >= 126.1 && lng! <= 127;
  return distanceKm(city, { lat: lat!, lng: lng! }) <= (code === 'incheon' ? 65 : 50);
}
