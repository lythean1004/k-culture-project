import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateCandidates } from '../../lib/recommend/candidates';
import { applyFilters } from '../../lib/recommend/filters';
import { scoreCandidate } from '../../lib/recommend/scorer';
import { bundlePackages } from '../../lib/recommend/bundler';
import { RecommendContext, RecommendInput } from '../../lib/recommend/types';
import { GET as getPackageDetails } from '../../app/api/packages/[packageId]/route';
import { NextRequest } from 'next/server';

const originalSupabaseUrl = process.env.SUPABASE_URL;
const originalSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function withoutSupabaseEnv() {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function restoreSupabaseEnv() {
  if (originalSupabaseUrl === undefined) {
    delete process.env.SUPABASE_URL;
  } else {
    process.env.SUPABASE_URL = originalSupabaseUrl;
  }

  if (originalSupabaseKey === undefined) {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  } else {
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalSupabaseKey;
  }
}

function makeInput(cityCode: string): RecommendInput {
  return {
    cityCode,
    visitForm: 'DAY_TRIP',
    interests: ['HISTORY'],
    lang: 'en',
    transportMode: 'TRANSIT',
  };
}

describe('recommendation city scoping', () => {
  beforeEach(withoutSupabaseEnv);
  afterEach(restoreSupabaseEnv);

  it('does not mix Seoul semantic fallback results into Busan candidates', async () => {
    const candidates = await generateCandidates(makeInput('busan'));
    const names = candidates.map(candidate => candidate.nameKo);

    expect(names).toContain('부산박물관');
    expect(names).not.toContain('경복궁');
    expect(names).not.toContain('국립중앙박물관');
    expect(candidates.every(candidate => candidate.cityCode === 'busan')).toBe(true);
  });

  it('does not mix Seoul semantic fallback results into Gyeongju candidates', async () => {
    const candidates = await generateCandidates(makeInput('gyeongju'));
    const names = candidates.map(candidate => candidate.nameKo);

    expect(names).toContain('불국사');
    expect(names).toContain('국립경주박물관');
    expect(names).toContain('첨성대');
    expect(names).not.toContain('경복궁');
    expect(names).not.toContain('국립중앙박물관');
    expect(candidates.every(candidate => candidate.cityCode === 'gyeongju')).toBe(true);
  });

  it('builds Busan packages only from Busan items', async () => {
    const input = makeInput('busan');
    const context: RecommendContext = {
      now: new Date('2026-05-30T12:00:00+09:00'),
      weather: 'Clear',
      anchorPlaces: [],
    };

    const candidates = await generateCandidates(input);
    const filtered = applyFilters(candidates, input, context);
    const scored = filtered.map(candidate => ({
      ...candidate,
      score: scoreCandidate(candidate, input, context),
    }));
    const packages = bundlePackages(scored, input);
    const itemNames = packages.flatMap(pkg => pkg.items.map(item => item.nameKo || item.name));

    expect(packages[0]?.packageId).toContain('busan');
    expect(itemNames).toContain('부산박물관');
    expect(itemNames).not.toContain('경복궁');
    expect(itemNames).not.toContain('국립중앙박물관');
  });

  it('returns city-specific package details for local fallback package ids', async () => {
    const request = new NextRequest('http://localhost/api/packages/pkg-day-busan-history-0?city=busan');
    const response = await getPackageDetails(request, {
      params: { packageId: 'pkg-day-busan-history-0' },
    });
    const json = await response.json();
    const itemNames = json.data.items.map((item: { nameKo: string }) => item.nameKo);

    expect(json.data.cityName).toBe('BUSAN');
    expect(itemNames).toContain('부산박물관');
    expect(itemNames).not.toContain('경복궁');
    expect(itemNames).not.toContain('국립중앙박물관');
  });
});
