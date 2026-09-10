import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { getCityMockData } from '../../../../lib/recommend/candidates';
import { loadSnapshot } from '../../../../lib/recommend/snapshots';
import { ThemeCode } from '../../../../lib/recommend/types';
import { CITY_OPTIONS, dayCountFromVisitForm, formatCityScope, normalizeCityCode, normalizeCityCodes } from '../../../../lib/recommend/cities';

export const dynamic = "force-dynamic";

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

function inferCitiesFromPackageId(packageId: string): string[] {
  return CITY_OPTIONS
    .map(city => city.code)
    .filter(cityCode => packageId.includes(`-${cityCode}`) || packageId.includes(`${cityCode}-`));
}

function inferThemeFromPackageId(packageId: string): ThemeCode {
  const upperPackageId = packageId.toUpperCase();
  return THEME_CODES.find(theme => upperPackageId.includes(theme)) || 'HISTORY';
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function inferDayCountFromPackageId(packageId: string, cityCount: number): 1 | 2 | 3 {
  const match = packageId.match(/pkg-(\d)d-/);
  if (match?.[1] === '2' || match?.[1] === '3') return Number(match[1]) as 2 | 3;
  return Math.max(1, Math.min(cityCount, 3)) as 1 | 2 | 3;
}

function buildRouteLabel(dayCount: number, cityCodes: string[]): string {
  return Array.from({ length: dayCount }, (_, index) => {
    const cityCode = cityCodes[index % cityCodes.length];
    return `Day ${index + 1}: ${formatCityScope([cityCode])}`;
  }).join(' / ');
}

function parseDayNumber(value?: string | null): number | undefined {
  const match = value?.match(/^day:(\d+)$/);
  return match ? Number(match[1]) : undefined;
}

function selectLocalDayCandidates(cityCode: string, themeCode: ThemeCode) {
  const cityCandidates = getCityMockData(cityCode);
  const themed = cityCandidates.filter(candidate => candidate.themes.includes(themeCode));
  const food = cityCandidates.filter(candidate => candidate.themes.includes('FOOD'));
  const selected = [] as ReturnType<typeof getCityMockData>;

  for (const pool of [themed, food, themed, cityCandidates]) {
    const candidate = pool.find(item => !selected.some(selectedItem => selectedItem.id === item.id));
    if (candidate) selected.push(candidate);
  }

  return selected.slice(0, 4);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { packageId: string } }
) {
  try {
    const { packageId } = params;
    if (packageId.startsWith('route-')) {
      const snapshot = await loadSnapshot(packageId);
      return snapshot
        ? Response.json({ success: true, data: snapshot })
        : Response.json({ success: false, error: 'This route has expired. Generate a new itinerary.' }, { status: 410 });
    }
    const { searchParams } = new URL(req.url);
    const requestedCityCodes = searchParams.get('cities')
      ? normalizeCityCodes(undefined, searchParams.get('cities')?.split(','))
      : normalizeCityCodes(searchParams.get('city') || normalizeCityCode(inferCitiesFromPackageId(packageId)[0]), inferCitiesFromPackageId(packageId));
    const requestedCityCode = requestedCityCodes[0];

    const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!hasSupabase || !isUuid(packageId)) {
      const themeCode = inferThemeFromPackageId(packageId);
      const dayCount = inferDayCountFromPackageId(packageId, requestedCityCodes.length);
      const slotTypes = ['MORNING', 'LUNCH', 'AFTERNOON', 'EVENING'] as const;
      const items = Array.from({ length: dayCount }, (_, dayIndex) => {
        const cityCode = requestedCityCodes[dayIndex % requestedCityCodes.length];
        const selectedCandidates = selectLocalDayCandidates(cityCode, themeCode);

        return selectedCandidates.slice(0, 4).map((candidate, slotIndex) => ({
          id: `item-${candidate.id}-d${dayIndex + 1}-${slotIndex}`,
          itemType: candidate.entityType,
          refId: candidate.id,
          name: candidate.nameI18n?.en || candidate.nameKo,
          nameKo: candidate.nameKo,
          nameI18n: candidate.nameI18n,
          cityCode,
          dayNumber: dayIndex + 1,
          lat: candidate.lat,
          lng: candidate.lng,
          slotType: slotTypes[slotIndex] || 'EVENING',
          primaryType: candidate.primaryType,
          source: candidate.source,
        }));
      }).flat();
      const cityScopeName = formatCityScope(requestedCityCodes).toUpperCase();

      return Response.json({
        success: true,
        data: {
          packageId,
          themeCode,
          title: `${dayCount}-Day ${themeCode} Course in ${cityScopeName}`,
          summary: `${dayCount} concrete day-by-day route covering ${formatCityScope(requestedCityCodes)}.`,
          reasonText: `Curated from ${cityScopeName} candidates only.`,
          reasonTextSource: 'TEMPLATE_FALLBACK',
          cityName: cityScopeName,
          cityCodes: requestedCityCodes,
          dayCount,
          routeLabel: buildRouteLabel(dayCount, requestedCityCodes),
          durationHours: dayCount * 8,
          items,
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
      .select('id, seq, item_type, ref_id, slot_type, replacement_group')
      .eq('package_id', packageId)
      .order('seq', { ascending: true });

    if (itemsError) {
      return Response.json({ success: false, error: itemsError.message }, { status: 500 });
    }

    // 3. Resolve place / event details for each item
    const resolvedItems = [];
    for (const item of (items || [])) {
      if (item.item_type === 'PLACE') {
        const { data: place } = await supabaseAdmin
          .from('places')
          .select('name_ko, lat, lng, primary_type, cities(code), place_i18n(lang, name)')
          .eq('place_id', item.ref_id)
          .maybeSingle();

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
          cityCode: (Array.isArray(place?.cities) ? place?.cities[0]?.code : (place?.cities as any)?.code),
          dayNumber: parseDayNumber(item.replacement_group),
          lat: place?.lat ? parseFloat(place.lat) : undefined,
          lng: place?.lng ? parseFloat(place.lng) : undefined,
          slotType: item.slot_type,
          primaryType: place?.primary_type || 'ATTRACTION',
        });
      } else {
        const { data: event } = await supabaseAdmin
          .from('events')
          .select('title_ko, cities(code), event_i18n(lang, title)')
          .eq('event_id', item.ref_id)
          .maybeSingle();

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
          cityCode: (Array.isArray(event?.cities) ? event?.cities[0]?.code : (event?.cities as any)?.code),
          dayNumber: parseDayNumber(item.replacement_group),
          slotType: item.slot_type,
          primaryType: 'PERFORMANCE',
        });
      }
    }

    const resolvedCityCodes = Array.from(new Set(resolvedItems.map((item: any) => item.cityCode).filter(Boolean)));
    const outputCityCodes = resolvedCityCodes.length > 0 ? resolvedCityCodes : requestedCityCodes;
    const dayCount = Math.max(
      ...resolvedItems.map((item: any) => item.dayNumber || 1),
      dayCountFromVisitForm(pkg.visit_form, undefined)
    ) as 1 | 2 | 3;
    const cityName = formatCityScope(outputCityCodes).toUpperCase();

    return Response.json({
      success: true,
      data: {
        packageId: pkg.package_id,
        themeCode: (Array.isArray(pkg.themes) ? pkg.themes[0]?.code : (pkg.themes as any)?.code) || 'HISTORY',
        title: pkg.title,
        summary: pkg.summary,
        reasonText: pkg.reason_text,
        reasonTextSource: pkg.reason_text_source,
        cityName,
        cityCodes: outputCityCodes,
        dayCount,
        routeLabel: buildRouteLabel(dayCount, outputCityCodes),
        durationHours: pkg.duration_hours,
        items: resolvedItems,
      },
    });
  } catch (error: any) {
    console.error('[Package Detail API] Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
