CREATE OR REPLACE FUNCTION find_nearby_places(
  target_lat NUMERIC,
  target_lng NUMERIC,
  radius_m INTEGER DEFAULT 50
)
RETURNS TABLE (place_id UUID, name_ko TEXT, distance_m NUMERIC)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.place_id, 
    p.name_ko,
    ST_Distance(p.geom::geography, 
                ST_MakePoint(target_lng, target_lat)::geography)::NUMERIC AS distance_m
  FROM places p
  WHERE ST_DWithin(p.geom::geography, 
                   ST_MakePoint(target_lng, target_lat)::geography, 
                   radius_m)
  ORDER BY distance_m;
END;
$$;
