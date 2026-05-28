CREATE TABLE themes (
  theme_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code theme_code UNIQUE NOT NULL,
  name_ko TEXT, name_en TEXT, name_ja TEXT, 
  name_zh_hans TEXT, name_zh_hant TEXT,
  description TEXT
);

CREATE TABLE place_theme_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID REFERENCES places(place_id) ON DELETE CASCADE,
  theme_id UUID REFERENCES themes(theme_id) ON DELETE CASCADE,
  weight NUMERIC(3, 2) DEFAULT 0.5,
  source_type TEXT DEFAULT 'auto',
  UNIQUE(place_id, theme_id)
);

CREATE TABLE event_theme_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(event_id) ON DELETE CASCADE,
  theme_id UUID REFERENCES themes(theme_id) ON DELETE CASCADE,
  weight NUMERIC(3, 2) DEFAULT 0.5,
  UNIQUE(event_id, theme_id)
);

CREATE TABLE packages (
  package_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID REFERENCES cities(city_id),
  visit_form visit_form NOT NULL,
  theme_id UUID REFERENCES themes(theme_id),
  title TEXT,
  summary TEXT,
  duration_hours NUMERIC(4, 1),
  score NUMERIC(5, 2),
  reason_text TEXT,
  reason_text_source translation_source DEFAULT 'LLM_GENERATED',
  lang TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ                 -- 캐시 만료
);

CREATE INDEX idx_packages_lookup ON packages(city_id, visit_form, lang, generated_at);

CREATE TABLE package_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES packages(package_id) ON DELETE CASCADE,
  seq SMALLINT NOT NULL,
  item_type TEXT CHECK (item_type IN ('PLACE','EVENT')),
  ref_id UUID NOT NULL,
  slot_type slot_type,
  planned_start_at TIMESTAMPTZ,
  planned_end_at TIMESTAMPTZ,
  replacement_group TEXT,
  UNIQUE(package_id, seq)
);
