CREATE TABLE glossary_terms (
  term_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ko TEXT NOT NULL,
  en TEXT,
  zh_hans TEXT,
  zh_hant TEXT,
  ja TEXT,
  category TEXT,                         -- 관광지·문화시설·전시·문화재
  standard_source TEXT DEFAULT 'seoul_dict',
  approved_flag BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_glossary_ko ON glossary_terms(ko);

CREATE TABLE editorial_curations (
  curation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID REFERENCES cities(city_id),
  theme_id UUID REFERENCES themes(theme_id),
  title TEXT NOT NULL,
  lang TEXT NOT NULL,
  body JSONB NOT NULL,
  publish_from TIMESTAMPTZ,
  publish_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_sessions (
  session_id TEXT PRIMARY KEY,
  lang TEXT NOT NULL,
  city_id UUID REFERENCES cities(city_id),
  visit_form visit_form,
  interests JSONB,                       -- theme_code 배열
  transport_mode TEXT,
  start_time_pref TEXT,
  consent_location BOOLEAN DEFAULT false,
  user_embedding vector(384),            -- 사용자 관심사 임베딩
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recommendation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT,
  package_id UUID REFERENCES packages(package_id),
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  clicked_at TIMESTAMPTZ,
  saved_at TIMESTAMPTZ,
  outlink_clicked_at TIMESTAMPTZ,
  swap_count INTEGER DEFAULT 0,
  feedback JSONB
);

CREATE INDEX idx_reclog_session ON recommendation_logs(session_id);
CREATE INDEX idx_reclog_package ON recommendation_logs(package_id);

CREATE TABLE license_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_name source_name NOT NULL,
  dataset_name TEXT NOT NULL,
  license_type TEXT NOT NULL,            -- 'KOGL_TYPE_1' 등
  image_usage_scope TEXT,
  attribution_required BOOLEAN DEFAULT true,
  ci_use_forbidden BOOLEAN DEFAULT true,
  notes TEXT,
  UNIQUE(source_name, dataset_name)
);
