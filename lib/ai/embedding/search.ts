import { supabaseAdmin } from '../../supabase/admin';

export async function searchSimilarPlaces(params: {
  queryVector: number[];
  cityId?: string;
  lang: string;
  limit?: number;
}) {
  const { queryVector, cityId, lang, limit = 50 } = params;
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[Embedding Search] Supabase config missing. Returning dummy place results.');
    return [
      {
        place_id: 'dummy-place-1',
        city_id: cityId || 'dummy-city-1',
        primary_type: 'ATTRACTION',
        name: 'Gyeongbokgung Palace (Mock Search)',
        similarity: 0.85,
      },
      {
        place_id: 'dummy-place-2',
        city_id: cityId || 'dummy-city-1',
        primary_type: 'MUSEUM',
        name: 'National Museum of Korea (Mock Search)',
        similarity: 0.78,
      }
    ];
  }

  const { data, error } = await supabaseAdmin.rpc('search_places_by_embedding', {
    query_vector: queryVector,
    target_lang: lang,
    target_city_id: cityId || null,
    result_limit: limit,
  });
  
  if (error) throw error;
  return data;
}

export async function searchSimilarEvents(params: {
  queryVector: number[];
  cityId?: string;
  lang: string;
  limit?: number;
}) {
  const { queryVector, cityId, lang, limit = 30 } = params;
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[Embedding Search] Supabase config missing. Returning dummy event results.');
    return [
      {
        event_id: 'dummy-event-1',
        city_id: cityId || 'dummy-city-1',
        title: 'Traditional Gugak Performance (Mock Search)',
        similarity: 0.82,
      }
    ];
  }

  const { data, error } = await supabaseAdmin.rpc('search_events_by_embedding', {
    query_vector: queryVector,
    target_lang: lang,
    target_city_id: cityId || null,
    result_limit: limit,
  });
  
  if (error) throw error;
  return data;
}
