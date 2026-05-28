-- City 마스터
CREATE TABLE cities (
  city_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name_ko TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ja TEXT NOT NULL,
  name_zh_hans TEXT NOT NULL,
  name_zh_hant TEXT NOT NULL,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  active_flag BOOLEAN DEFAULT true,
  coverage_badge TEXT CHECK (coverage_badge IN ('high','medium','low')),
  area_code TEXT,                          -- TourAPI areaCode
  signgu_code TEXT,                        -- KOPIS signgucode
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Place 마스터
CREATE TABLE places (
  place_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID REFERENCES cities(city_id) ON DELETE CASCADE,
  primary_type place_primary_type NOT NULL,
  sub_type TEXT,
  name_ko TEXT NOT NULL,
  addr_ko TEXT,
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  geom GEOGRAPHY(Point, 4326),
  indoor_outdoor indoor_outdoor DEFAULT 'INDOOR',
  official_url TEXT,
  phone TEXT,
  source_confidence NUMERIC(3, 2) DEFAULT 0.5,
  freshness_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_places_city ON places(city_id);
CREATE INDEX idx_places_type ON places(primary_type);
CREATE INDEX idx_places_geom ON places USING GIST(geom);

-- 다국어 텍스트
CREATE TABLE place_i18n (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID REFERENCES places(place_id) ON DELETE CASCADE,
  lang TEXT NOT NULL CHECK (lang IN ('en','ja','zh-Hans','zh-Hant','ko')),
  name TEXT NOT NULL,
  short_desc TEXT,
  long_desc TEXT,
  translation_source translation_source NOT NULL DEFAULT 'MT_GLOSSARY',
  quality_grade quality_grade DEFAULT 'C',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(place_id, lang)
);

-- 마스터 매핑 테이블 (소스 ID ↔ 내부 ID)
CREATE TABLE place_source_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID REFERENCES places(place_id) ON DELETE CASCADE,
  source_name source_name NOT NULL,
  source_place_id TEXT NOT NULL,
  content_type_id TEXT,
  dataset_version TEXT,
  raw_url TEXT,
  raw_json JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_name, source_place_id)
);

-- 운영시간
CREATE TABLE operating_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID REFERENCES places(place_id) ON DELETE CASCADE,
  day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME,
  close_time TIME,
  holiday_rule JSONB,
  last_updated_at TIMESTAMPTZ DEFAULT NOW()
);
