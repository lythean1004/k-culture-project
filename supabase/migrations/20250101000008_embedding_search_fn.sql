CREATE OR REPLACE FUNCTION search_places_by_embedding(
  query_vector vector(384),
  target_lang TEXT,
  target_city_id UUID DEFAULT NULL,
  result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  place_id UUID,
  city_id UUID,
  primary_type TEXT,
  name TEXT,
  similarity NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.place_id,
    p.city_id,
    p.primary_type::TEXT,
    COALESCE(pi.name, p.name_ko) AS name,
    (1 - (e.vector <=> query_vector))::NUMERIC AS similarity
  FROM embeddings e
  INNER JOIN places p ON p.place_id = e.entity_id
  LEFT JOIN place_i18n pi ON pi.place_id = p.place_id AND pi.lang = target_lang
  WHERE e.entity_type = 'PLACE'
    AND e.lang = target_lang
    AND (target_city_id IS NULL OR p.city_id = target_city_id)
  ORDER BY e.vector <=> query_vector
  LIMIT result_limit;
END;
$$;

CREATE OR REPLACE FUNCTION search_events_by_embedding(
  query_vector vector(384),
  target_lang TEXT,
  target_city_id UUID DEFAULT NULL,
  result_limit INTEGER DEFAULT 30
)
RETURNS TABLE (
  event_id UUID,
  city_id UUID,
  title TEXT,
  similarity NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ev.event_id,
    ev.city_id,
    COALESCE(ei.title, ev.title_ko) AS title,
    (1 - (e.vector <=> query_vector))::NUMERIC AS similarity
  FROM embeddings e
  INNER JOIN events ev ON ev.event_id = e.entity_id
  LEFT JOIN event_i18n ei ON ei.event_id = ev.event_id AND ei.lang = target_lang
  WHERE e.entity_type = 'EVENT'
    AND e.lang = target_lang
    AND (target_city_id IS NULL OR ev.city_id = target_city_id)
  ORDER BY e.vector <=> query_vector
  LIMIT result_limit;
END;
$$;
