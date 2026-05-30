import { PackageItem } from './types';
import { supabaseAdmin } from '../supabase/admin';
import { getCityMockData } from './candidates';

export async function findSwapCandidates(
  packageId: string,
  itemIndex: number,
  hint?: string,             // "indoor" "shorter" etc.
  cityCode = 'seoul'
): Promise<PackageItem[]> {
  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasSupabase) {
    const mockSwaps: PackageItem[] = getCityMockData(cityCode)
      .filter(candidate => candidate.entityType === 'PLACE')
      .map((candidate, index) => ({
        id: `swap-${candidate.id}-${index}`,
        itemType: 'PLACE',
        refId: candidate.id,
        name: candidate.nameI18n?.en || candidate.nameKo,
        nameKo: candidate.nameKo,
        nameI18n: candidate.nameI18n,
        lat: candidate.lat,
        lng: candidate.lng,
        slotType: 'MORNING',
        primaryType: candidate.primaryType,
      }));

    if (hint === 'indoor') {
      return mockSwaps.filter(item => item.name.includes('Museum') || item.name.includes('Art'));
    }
    return mockSwaps;
  }

  // Retrieve raw places from database
  const { data: places } = await supabaseAdmin
    .from('places')
    .select('place_id, name_ko, lat, lng, indoor_outdoor, cities!inner(code)')
    .eq('cities.code', cityCode)
    .limit(5);

  let filtered = places || [];
  if (hint === 'indoor') {
    filtered = filtered.filter((p: any) => p.indoor_outdoor === 'INDOOR');
  }

  return filtered.map((p: any, idx: number) => ({
    id: `swap-item-${p.place_id}-${idx}`,
    itemType: 'PLACE',
    refId: p.place_id,
    name: p.name_ko,
    lat: p.lat ? parseFloat(p.lat) : undefined,
    lng: p.lng ? parseFloat(p.lng) : undefined,
    slotType: 'MORNING', // Assumed slot type matching the swap position
  }));
}
