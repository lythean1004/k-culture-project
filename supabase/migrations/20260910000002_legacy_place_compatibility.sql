-- Additive compatibility for projects originally installed with init.sql.
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS addr_ko TEXT;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS geom GEOGRAPHY(Point, 4326);
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS source_confidence NUMERIC(3,2) DEFAULT 0.5;
ALTER TABLE public.place_source_map ADD COLUMN IF NOT EXISTS raw_json JSONB;
ALTER TABLE public.place_i18n ADD COLUMN IF NOT EXISTS short_desc TEXT;
ALTER TABLE public.place_i18n ADD COLUMN IF NOT EXISTS long_desc TEXT;
ALTER TABLE public.place_i18n ADD COLUMN IF NOT EXISTS translation_source TEXT DEFAULT 'MT_GLOSSARY';
ALTER TABLE public.place_i18n ADD COLUMN IF NOT EXISTS quality_grade TEXT DEFAULT 'C';

-- Copy the old address only when the legacy column exists.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='places' AND column_name='address') THEN
    EXECUTE 'UPDATE public.places SET addr_ko=address WHERE addr_ko IS NULL';
  END IF;
END $$;

-- Avoid overload ambiguity with the legacy radius_km implementation.
DROP FUNCTION IF EXISTS public.find_nearby_places(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS public.find_nearby_places(NUMERIC, NUMERIC, INTEGER);
CREATE OR REPLACE FUNCTION public.find_nearby_places(target_lat DOUBLE PRECISION, target_lng DOUBLE PRECISION, radius_m INTEGER DEFAULT 50)
RETURNS TABLE(place_id UUID, name_ko TEXT, distance_m DOUBLE PRECISION)
LANGUAGE sql STABLE AS $$
  SELECT p.place_id, p.name_ko,
    ST_Distance(ST_SetSRID(ST_MakePoint(p.lng,p.lat),4326)::geography, ST_SetSRID(ST_MakePoint(target_lng,target_lat),4326)::geography)
  FROM public.places p
  WHERE p.lat IS NOT NULL AND p.lng IS NOT NULL
    AND ST_DWithin(ST_SetSRID(ST_MakePoint(p.lng,p.lat),4326)::geography, ST_SetSRID(ST_MakePoint(target_lng,target_lat),4326)::geography, radius_m)
  ORDER BY 3 LIMIT 20;
$$;
