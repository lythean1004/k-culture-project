import { describe, expect, it, vi } from 'vitest';
import { cityFromAddress, coordinateFitsCity } from '../../lib/recommend/geography';
import { CITY_OPTIONS } from '../../lib/recommend/cities';
import { getCityMockData } from '../../lib/recommend/candidates';
import { bundlePackages } from '../../lib/recommend/bundler';
import { applyFilters } from '../../lib/recommend/filters';
import { scoreCandidate } from '../../lib/recommend/scorer';
import { RecommendInput } from '../../lib/recommend/types';
import { POST } from '../../app/api/recommend/route';
import { GET } from '../../app/api/packages/[packageId]/route';
import { NextRequest } from 'next/server';

describe('regional itinerary repairs', () => {
  it('uses administrative addresses and rejects ambiguous or missing cities', () => {
    expect(cityFromAddress('부산광역시 동구 중앙대로 179 차이나타운')).toBe('busan');
    expect(cityFromAddress('제주특별자치도 서귀포시 성산읍')).toBe('jeju');
    expect(cityFromAddress('경기도 광주시')).toBeUndefined();
    expect(cityFromAddress('강릉시 창해로')).toBe('gangneung');
    expect(cityFromAddress(undefined)).toBeUndefined();
    expect(coordinateFitsCity('busan', 37.5796, 126.977)).toBe(false);
  });

  it('creates every requested day without duplicate stops across all 18 cities', () => {
    const context = { now: new Date('2026-09-10'), anchorPlaces: [] };
    for (const city of CITY_OPTIONS) for (const days of [1, 2, 3] as const) {
      const input: RecommendInput = { cityCode: city.code, tripDays: days, visitForm: 'DAY_TRIP', interests: ['HISTORY'], lang: 'en', transportMode: 'TRANSIT' };
      const candidates = applyFilters(getCityMockData(city.code), input, context);
      const packages = bundlePackages(candidates.map(candidate => ({ ...candidate, score: scoreCandidate(candidate, input, context) })), input);
      expect(packages.length, `${city.code} ${days} days`).toBeGreaterThan(0);
      for (const pkg of packages) {
        expect(new Set(pkg.items.map(item => item.dayNumber)).size).toBe(days);
        expect(new Set(pkg.items.map(item => item.refId)).size).toBe(pkg.items.length);
        expect(pkg.items.every(item => item.cityCode === city.code)).toBe(true);
      }
    }
  });

  it('rejects wrongly assigned coordinates and keeps distant-user travel planning usable', () => {
    const input: RecommendInput = { cityCode: 'busan', tripDays: 1, visitForm: 'DAY_TRIP', interests: ['HISTORY'], lang: 'en', transportMode: 'WALK', currentLocation: { lat: 37.5665, lng: 126.978 } };
    const wrong = { ...getCityMockData('seoul')[0], cityCode: 'busan' };
    const filtered = applyFilters([...getCityMockData('busan'), wrong], input, { now: new Date(), anchorPlaces: [] });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.some(item => item.id === wrong.id)).toBe(false);
  });

  it('returns the exact generated snapshot on detail navigation even with conflicting URL cities', async () => {
    vi.stubEnv('SUPABASE_URL', ''); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    try {
      const response = await POST(new NextRequest('http://localhost/api/recommend', { method: 'POST', body: JSON.stringify({ cityCode: 'jeju', cityCodes: ['jeju', 'andong'], tripDays: 3, visitForm: 'THEME_TOUR', interests: ['HISTORY'], lang: 'en', transportMode: 'TRANSIT' }) }));
      expect(response.status).toBe(200);
      const result = await response.json();
      const pkg = result.packages[0];
      expect(pkg).toBeDefined();
      const details = await GET(new NextRequest(`http://localhost/api/packages/${pkg.packageId}?cities=seoul`), { params: { packageId: pkg.packageId } });
      expect((await details.json()).data).toEqual(pkg);
    } finally { vi.unstubAllEnvs(); }
  });
});
