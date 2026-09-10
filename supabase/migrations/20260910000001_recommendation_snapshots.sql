-- Works with both the migration schema and the older init.sql schema.
CREATE TABLE IF NOT EXISTS public.recommendation_snapshots (
  package_id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recommendation_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recommendation_snapshots FROM anon, authenticated;
GRANT ALL ON public.recommendation_snapshots TO service_role;
