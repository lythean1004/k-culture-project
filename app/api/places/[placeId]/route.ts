import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: { placeId: string } }
) {
  try {
    const { placeId } = params;

    const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!hasSupabase) {
      // Mock Place details fallback
      return Response.json({
        success: true,
        data: {
          placeId,
          nameKo: '경복궁',
          nameTranslated: 'Gyeongbokgung Palace',
          addrKo: '서울특별시 종로구 사직로 161',
          lat: 37.5796,
          lng: 126.9770,
          primaryType: 'ATTRACTION',
          officialUrl: 'https://www.royalpalace.go.kr',
          phone: '02-3700-3900',
          imageUrls: [
            'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1610448721566-47369c768e70?auto=format&fit=crop&w=800&q=80',
          ],
          descriptions: {
            en: 'Gyeongbokgung Palace was the main royal palace of the Joseon dynasty. Built in 1395, it is located in northern Seoul, South Korea.',
            ja: '景福宮は、李氏朝鮮の正宮です。1395年に創設され、大韓民国のソウル特別市に位置しています。',
            'zh-Hans': '景福宫是朝鲜王朝的主要皇宫。建于1395年，位于韩国首尔北部。',
          },
          operatingHours: [
            { day: 'Mon', open: '09:00', close: '18:00', closed: false },
            { day: 'Tue', open: '09:00', close: '18:00', closed: true }, // Closed on Tuesday
            { day: 'Wed', open: '09:00', close: '18:00', closed: false },
            { day: 'Thu', open: '09:00', close: '18:00', closed: false },
            { day: 'Fri', open: '09:00', close: '18:00', closed: false },
            { day: 'Sat', open: '09:00', close: '18:00', closed: false },
            { day: 'Sun', open: '09:00', close: '18:00', closed: false },
          ],
          relatedEvents: [
            {
              eventId: 'event-1',
              title: 'Changing of the Guard Ceremony',
              genre: 'FESTIVAL',
              status: 'ACTIVE',
            }
          ],
          nearbyRecommendations: [
            {
              placeId: 'nearby-1',
              nameKo: '국립고궁박물관',
              nameTranslated: 'National Palace Museum of Korea',
              primaryType: 'MUSEUM',
            },
            {
              placeId: 'nearby-2',
              nameKo: '북촌한옥마을',
              nameTranslated: 'Bukchon Hanok Village',
              primaryType: 'ATTRACTION',
            }
          ],
        }
      });
    }

    // 1. Fetch place master record
    const { data: place, error: placeError } = await supabaseAdmin
      .from('places')
      .select('place_id, name_ko, addr_ko, lat, lng, primary_type, official_url, phone, city_id, place_i18n(lang, name, short_desc, long_desc)')
      .eq('place_id', placeId)
      .maybeSingle();

    if (placeError || !place) {
      return Response.json({ success: false, error: 'Place not found' }, { status: 404 });
    }

    // 2. Fetch operating hours
    const { data: hours } = await supabaseAdmin
      .from('operating_hours')
      .select('day_of_week, open_time, close_time')
      .eq('place_id', placeId);

    // 3. Fetch related events at this place
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('event_id, title_ko, genre, status')
      .eq('venue_place_id', placeId)
      .eq('status', 'ACTIVE')
      .limit(3);

    // 4. Fetch nearby places (within 1km radius / spatial query if geom exists, or fallback simple query)
    const { data: nearby } = await supabaseAdmin
      .from('places')
      .select('place_id, name_ko, primary_type')
      .eq('city_id', place.city_id)
      .neq('place_id', placeId)
      .limit(3);

    // Parse translations
    const descriptions: Record<string, string> = {};
    const translatedNames: Record<string, string> = {};
    if (place && Array.isArray(place.place_i18n)) {
      place.place_i18n.forEach((pi: any) => {
        translatedNames[pi.lang] = pi.name;
        descriptions[pi.lang] = pi.long_desc || pi.short_desc || '';
      });
    }

    // Map operating hours standard format
    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formattedHours = daysMap.map((day, idx) => {
      const match = hours?.find((h) => h.day_of_week === idx);
      return {
        day,
        open: match?.open_time ? match.open_time.slice(0, 5) : '09:00',
        close: match?.close_time ? match.close_time.slice(0, 5) : '18:00',
        closed: !match, // If no row exists, assume closed
      };
    });

    return Response.json({
      success: true,
      data: {
        placeId: place.place_id,
        nameKo: place.name_ko,
        nameTranslated: translatedNames,
        addrKo: place.addr_ko,
        lat: place.lat ? parseFloat(place.lat) : undefined,
        lng: place.lng ? parseFloat(place.lng) : undefined,
        primaryType: place.primary_type,
        officialUrl: place.official_url,
        phone: place.phone,
        imageUrls: [
          'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1610448721566-47369c768e70?auto=format&fit=crop&w=800&q=80',
        ],
        descriptions,
        operatingHours: formattedHours,
        relatedEvents: (events || []).map((e) => ({
          eventId: e.event_id,
          title: e.title_ko,
          genre: e.genre,
          status: e.status,
        })),
        nearbyRecommendations: (nearby || []).map((n) => ({
          placeId: n.place_id,
          nameKo: n.name_ko,
          nameTranslated: n.name_ko, // Fallback
          primaryType: n.primary_type,
        })),
      }
    });
  } catch (error: any) {
    console.error('[Place Detail API] Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
