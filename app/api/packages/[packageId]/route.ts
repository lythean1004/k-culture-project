import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { getCityMockData } from '../../../../lib/recommend/candidates';
import { ThemeCode } from '../../../../lib/recommend/types';

export const dynamic = "force-dynamic";

const CITY_CODES = ['seoul', 'busan', 'gyeongju', 'jeonju', 'namwon'];
const THEME_CODES: ThemeCode[] = [
  'HISTORY',
  'TRADITIONAL_MUSIC',
  'MODERN_ART',
  'FAMILY',
  'NIGHT',
  'WELLNESS',
  'FOOD',
  'FESTIVAL',
];

function normalizeCityCode(value?: string | null): string {
  const normalized = value?.toLowerCase();
  return normalized && CITY_CODES.includes(normalized) ? normalized : 'seoul';
}

function inferCityFromPackageId(packageId: string): string | undefined {
  return CITY_CODES.find(cityCode => packageId.includes(`-${cityCode}-`));
}

function inferThemeFromPackageId(packageId: string): ThemeCode {
  const upperPackageId = packageId.toUpperCase();
  return THEME_CODES.find(theme => upperPackageId.includes(theme)) || 'HISTORY';
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { packageId: string } }
) {
  try {
    const { packageId } = params;
    const { searchParams } = new URL(req.url);
    const requestedCityCode = normalizeCityCode(searchParams.get('city') || inferCityFromPackageId(packageId));

    const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!hasSupabase || !isUuid(packageId)) {
      const themeCode = inferThemeFromPackageId(packageId);
      const cityCandidates = getCityMockData(requestedCityCode);
      const themedCandidates = cityCandidates.filter(candidate => candidate.themes.includes(themeCode));
      const selectedCandidates = themedCandidates.length > 0 ? themedCandidates : cityCandidates;
      const slotTypes = ['MORNING', 'LUNCH', 'AFTERNOON', 'EVENING'] as const;

      return Response.json({
        success: true,
        data: {
          packageId,
          themeCode,
          title: `${themeCode} Route in ${requestedCityCode.toUpperCase()}`,
          summary: `A city-specific cultural route built from ${requestedCityCode.toUpperCase()} places.`,
          reasonText: `Curated from ${requestedCityCode.toUpperCase()} candidates only.`,
          reasonTextSource: 'TEMPLATE_FALLBACK',
          cityName: requestedCityCode.toUpperCase(),
          durationHours: 8,
          items: selectedCandidates.slice(0, 4).map((candidate, index) => ({
            id: `item-${candidate.id}-${index}`,
            itemType: candidate.entityType,
            refId: candidate.id,
            name: candidate.nameI18n?.en || candidate.nameKo,
            nameKo: candidate.nameKo,
            nameI18n: candidate.nameI18n,
            lat: candidate.lat,
            lng: candidate.lng,
            slotType: slotTypes[index] || 'EVENING',
            primaryType: candidate.primaryType,
          })),
        },
      });
    }

    // 1. Fetch package record
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages')
      .select('package_id, city_id, title, summary, duration_hours, score, reason_text, reason_text_source, lang, visit_form, theme_id, themes(code), cities(code)')
      .eq('package_id', packageId)
      .maybeSingle();

    if (pkgError || !pkg) {
      return Response.json({ success: false, error: 'Package not found' }, { status: 404 });
    }

    // 2. Fetch package items ordered by seq
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('package_items')
      .select('id, seq, item_type, ref_id, slot_type')
      .eq('package_id', packageId)
      .order('seq', { ascending: true });

    if (itemsError) {
      return Response.json({ success: false, error: itemsError.message }, { status: 500 });
    }

    // 3. Resolve place / event details for each item
    const resolvedItems = [];
    for (const item of (items || [])) {
      if (item.item_type === 'PLACE') {
        let placeQuery = supabaseAdmin
          .from('places')
          .select('name_ko, lat, lng, primary_type, place_i18n(lang, name)')
          .eq('place_id', item.ref_id);

        if (pkg.city_id) {
          placeQuery = placeQuery.eq('city_id', pkg.city_id);
        }

        const { data: place } = await placeQuery.maybeSingle();

        const nameI18n: Record<string, string> = {};
        if (place && Array.isArray(place.place_i18n)) {
          place.place_i18n.forEach((pi: any) => {
            nameI18n[pi.lang] = pi.name;
          });
        }

        resolvedItems.push({
          id: item.id,
          itemType: item.item_type,
          refId: item.ref_id,
          name: place?.name_ko || 'Unknown Place',
          nameKo: place?.name_ko || 'Unknown Place',
          nameI18n,
          lat: place?.lat ? parseFloat(place.lat) : undefined,
          lng: place?.lng ? parseFloat(place.lng) : undefined,
          slotType: item.slot_type,
          primaryType: place?.primary_type || 'ATTRACTION',
        });
      } else {
        let eventQuery = supabaseAdmin
          .from('events')
          .select('title_ko, event_i18n(lang, title)')
          .eq('event_id', item.ref_id);

        if (pkg.city_id) {
          eventQuery = eventQuery.eq('city_id', pkg.city_id);
        }

        const { data: event } = await eventQuery.maybeSingle();

        const nameI18n: Record<string, string> = {};
        if (event && Array.isArray(event.event_i18n)) {
          event.event_i18n.forEach((ei: any) => {
            nameI18n[ei.lang] = ei.title;
          });
        }

        resolvedItems.push({
          id: item.id,
          itemType: item.item_type,
          refId: item.ref_id,
          name: event?.title_ko || 'Unknown Event',
          nameKo: event?.title_ko || 'Unknown Event',
          nameI18n,
          slotType: item.slot_type,
          primaryType: 'PERFORMANCE',
        });
      }
    }

    return Response.json({
      success: true,
      data: {
        packageId: pkg.package_id,
        themeCode: (Array.isArray(pkg.themes) ? pkg.themes[0]?.code : (pkg.themes as any)?.code) || 'HISTORY',
        title: pkg.title,
        summary: pkg.summary,
        reasonText: pkg.reason_text,
        reasonTextSource: pkg.reason_text_source,
        cityName: (Array.isArray(pkg.cities) ? pkg.cities[0]?.code : (pkg.cities as any)?.code) || requestedCityCode.toUpperCase(),
        durationHours: pkg.duration_hours,
        items: resolvedItems,
      },
    });
  } catch (error: any) {
    console.error('[Package Detail API] Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
