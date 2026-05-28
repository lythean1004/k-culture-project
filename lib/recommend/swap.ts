import { PackageItem } from './types';
import { supabaseAdmin } from '../supabase/admin';

export async function findSwapCandidates(
  packageId: string,
  itemIndex: number,
  hint?: string             // "indoor" "shorter" etc.
): Promise<PackageItem[]> {
  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasSupabase) {
    // Return mock swaps for local environments
    const mockSwaps: PackageItem[] = [
      {
        id: 'swap-place-1',
        itemType: 'PLACE',
        refId: 'place-uuid-swap-1',
        name: 'Deoksugung Palace (Swap Choice)',
        lat: 37.5658,
        lng: 126.9752,
        slotType: 'MORNING'
      },
      {
        id: 'swap-place-2',
        itemType: 'PLACE',
        refId: 'place-uuid-swap-2',
        name: 'Seoul Museum of Art (Indoor Choice)',
        lat: 37.5641,
        lng: 126.9738,
        slotType: 'MORNING'
      }
    ];

    if (hint === 'indoor') {
      return mockSwaps.filter(item => item.name.includes('Museum') || item.name.includes('Art'));
    }
    return mockSwaps;
  }

  // Retrieve raw places from database
  const { data: places } = await supabaseAdmin
    .from('places')
    .select('place_id, name_ko, lat, lng, indoor_outdoor')
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
