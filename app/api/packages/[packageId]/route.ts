import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { packageId: string } }
) {
  try {
    const { packageId } = params;

    const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!hasSupabase) {
      // Mock package details fallback for local environment
      return Response.json({
        success: true,
        data: {
          packageId,
          themeCode: 'HISTORY',
          title: 'Premium History Deep-Dive Route',
          summary: 'A special heritage course exploring palace highlights and museum treasures.',
          reasonText: 'Curated based on your high interest in historical artifacts and royal palace architecture.',
          reasonTextSource: 'LLM_GENERATED',
          cityName: 'SEOUL',
          durationHours: 8,
          items: [
            {
              id: 'item-1',
              itemType: 'PLACE',
              refId: 'place-1',
              name: 'Gyeongbokgung Palace',
              nameKo: '경복궁',
              nameI18n: { en: 'Gyeongbokgung Palace', ja: '景福宮', 'zh-Hans': '景福宫' },
              lat: 37.5796,
              lng: 126.9770,
              slotType: 'MORNING',
              primaryType: 'ATTRACTION',
            },
            {
              id: 'item-2',
              itemType: 'PLACE',
              refId: 'place-2',
              name: 'National Museum of Korea',
              nameKo: '국립중앙박물관',
              nameI18n: { en: 'National Museum of Korea', ja: '国立中央博物館', 'zh-Hans': '国立中央博物馆' },
              lat: 37.5240,
              lng: 126.9804,
              slotType: 'AFTERNOON',
              primaryType: 'MUSEUM',
            },
          ],
        },
      });
    }

    // 1. Fetch package record
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages')
      .select('package_id, title, summary, duration_hours, score, reason_text, reason_text_source, lang, visit_form, theme_id, themes(code), cities(code)')
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
        const { data: place } = await supabaseAdmin
          .from('places')
          .select('name_ko, lat, lng, primary_type, place_i18n(lang, name)')
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
          lat: place?.lat ? parseFloat(place.lat) : undefined,
          lng: place?.lng ? parseFloat(place.lng) : undefined,
          slotType: item.slot_type,
          primaryType: place?.primary_type || 'ATTRACTION',
        });
      } else {
        const { data: event } = await supabaseAdmin
          .from('events')
          .select('title_ko, event_i18n(lang, title)')
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
        cityName: (Array.isArray(pkg.cities) ? pkg.cities[0]?.code : (pkg.cities as any)?.code) || 'SEOUL',
        durationHours: pkg.duration_hours,
        items: resolvedItems,
      },
    });
  } catch (error: any) {
    console.error('[Package Detail API] Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
