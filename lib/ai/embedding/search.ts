import { supabaseAdmin } from '../../supabase/admin';

export async function searchSimilarPlaces(params: {
  queryVector: number[];
  cityId?: string;
  lang: string;
  limit?: number;
}) {
  const { queryVector, cityId, lang, limit = 50 } = params;
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[Embedding Search] Supabase config missing. Skipping semantic place results.');
    return [];
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
    console.warn('[Embedding Search] Supabase config missing. Skipping semantic event results.');
    return [];
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
