import { supabaseAdmin } from '../supabase/admin';
import { NormalizedEvent } from '../sources/_types';

export async function findOrCreateEvent(normalized: NormalizedEvent): Promise<string> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[event-normalizer] Supabase credentials missing. Returning dummy event ID.');
    return '00000000-0000-0000-0000-000000000000';
  }

  // 1. Check duplicate by source
  const { data: existing } = await supabaseAdmin
    .from('events')
    .select('event_id')
    .eq('source_name', normalized.sourceName)
    .eq('source_event_id', normalized.sourceEventId)
    .maybeSingle();

  if (existing) return existing.event_id;

  // 2. Resolve city_id (using first city as default fallback)
  const { data: city } = await supabaseAdmin
    .from('cities')
    .select('city_id')
    .limit(1)
    .single();

  const cityId = city?.city_id || '00000000-0000-0000-0000-000000000000';

  // 3. Map place by venueName if possible
  let venuePlaceId: string | null = null;
  if (normalized.venueName) {
    const { data: place } = await supabaseAdmin
      .from('places')
      .select('place_id')
      .ilike('name_ko', `%${normalized.venueName}%`)
      .limit(1)
      .maybeSingle();
    if (place) venuePlaceId = place.place_id;
  }

  // 4. Create new event
  const { data: newEvent, error: insertError } = await supabaseAdmin
    .from('events')
    .insert({
      city_id: cityId,
      event_type: normalized.eventType,
      title_ko: normalized.titleKo,
      venue_place_id: venuePlaceId,
      source_name: normalized.sourceName,
      source_event_id: normalized.sourceEventId,
      genre: normalized.genre || 'ETC',
      official_url: normalized.officialUrl || null,
      poster_url: normalized.posterUrl || null,
      foreigner_friendly: normalized.foreignerFriendly,
    })
    .select('event_id')
    .single();

  if (insertError || !newEvent) {
    throw new Error(`Failed to insert new event: ${insertError?.message || 'Unknown'}`);
  }

  // 5. Add translations
  if (normalized.titleI18n && normalized.titleI18n.length > 0) {
    await supabaseAdmin.from('event_i18n').upsert(
      normalized.titleI18n.map(i => ({
        event_id: newEvent.event_id,
        lang: i.lang,
        title: i.title,
        translation_source: 'MT_GLOSSARY',
        quality_grade: 'C',
      }))
    );
  }

  // 6. Add event sessions
  if (normalized.sessions && normalized.sessions.length > 0) {
    await supabaseAdmin.from('event_sessions').insert(
      normalized.sessions.map(s => ({
        event_id: newEvent.event_id,
        start_at: s.startAt.toISOString(),
        end_at: s.endAt ? s.endAt.toISOString() : null,
        runtime_min: s.runtimeMin || null,
      }))
    );
  }

  return newEvent.event_id;
}
