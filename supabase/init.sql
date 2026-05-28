-- ============================================================
-- K-Culture Curation Platform - Supabase 초기 설정 SQL
-- Supabase SQL Editor에서 이 스크립트 전체를 실행하세요.
-- ============================================================

-- 0. 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";    -- pgvector (임베딩 검색용)

-- ============================================================
-- 1. 핵심 테이블
-- ============================================================

-- 1-1. 도시
CREATE TABLE IF NOT EXISTS cities (
  city_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code       TEXT UNIQUE NOT NULL,       -- 'seoul', 'busan', ...
  name_ko    TEXT NOT NULL,
  name_en    TEXT NOT NULL,
  name_ja    TEXT,
  name_zh_cn TEXT,
  name_zh_tw TEXT,
  lat        DOUBLE PRECISION,
  lng        DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1-2. 테마
CREATE TABLE IF NOT EXISTS themes (
  theme_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code     TEXT UNIQUE NOT NULL,   -- 'HISTORY', 'FOOD', 'NIGHT', ...
  name_ko  TEXT NOT NULL,
  name_en  TEXT NOT NULL,
  name_ja  TEXT,
  name_zh_cn TEXT,
  name_zh_tw TEXT
);

-- 1-3. 장소
CREATE TABLE IF NOT EXISTS places (
  place_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id        UUID REFERENCES cities(city_id),
  name_ko        TEXT NOT NULL,
  primary_type   TEXT NOT NULL,  -- 'ATTRACTION', 'MUSEUM', 'ART_GALLERY', 'RESTAURANT', ...
  sub_type       TEXT,
  lat            DOUBLE PRECISION,
  lng            DOUBLE PRECISION,
  address        TEXT,
  phone          TEXT,
  official_url   TEXT,
  image_url      TEXT,
  indoor_outdoor TEXT,           -- 'INDOOR', 'OUTDOOR', 'BOTH'
  quality_grade  TEXT DEFAULT 'A',
  source         TEXT,           -- 'tourapi', 'emuseum', 'manual'
  source_id      TEXT,
  embedding      vector(384),    -- multilingual-e5-small 임베딩 (384차원)
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- 1-4. 장소 다국어
CREATE TABLE IF NOT EXISTS place_i18n (
  place_id UUID REFERENCES places(place_id) ON DELETE CASCADE,
  lang     TEXT NOT NULL,    -- 'en', 'ja', 'zh-Hans', 'zh-Hant'
  name     TEXT NOT NULL,
  description TEXT,
  PRIMARY KEY (place_id, lang)
);

-- 1-5. 장소 ↔ 테마 매핑
CREATE TABLE IF NOT EXISTS place_theme_map (
  place_id UUID REFERENCES places(place_id) ON DELETE CASCADE,
  theme_id UUID REFERENCES themes(theme_id) ON DELETE CASCADE,
  PRIMARY KEY (place_id, theme_id)
);

-- 1-6. 장소 소스 맵 (중복 방지)
CREATE TABLE IF NOT EXISTS place_source_map (
  place_id       UUID REFERENCES places(place_id) ON DELETE CASCADE,
  source_name    TEXT NOT NULL,
  source_place_id TEXT NOT NULL,
  PRIMARY KEY (source_name, source_place_id)
);

-- 1-7. 이벤트(공연/축제)
CREATE TABLE IF NOT EXISTS events (
  event_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id      UUID REFERENCES cities(city_id),
  title_ko     TEXT NOT NULL,
  genre        TEXT,            -- 'TRADITIONAL_MUSIC', 'PLAY', 'MUSICAL', ...
  status       TEXT DEFAULT 'ACTIVE',
  start_date   DATE,
  end_date     DATE,
  place_name   TEXT,
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  official_url TEXT,
  image_url    TEXT,
  source       TEXT,
  source_id    TEXT,
  embedding    vector(384),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 1-8. 이벤트 다국어
CREATE TABLE IF NOT EXISTS event_i18n (
  event_id    UUID REFERENCES events(event_id) ON DELETE CASCADE,
  lang        TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  PRIMARY KEY (event_id, lang)
);

-- 1-9. 이벤트 세션
CREATE TABLE IF NOT EXISTS event_sessions (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id   UUID REFERENCES events(event_id) ON DELETE CASCADE,
  start_at   TIMESTAMPTZ NOT NULL,
  end_at     TIMESTAMPTZ
);

-- ============================================================
-- 2. 추천/패키지 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS packages (
  package_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_form        TEXT,
  title             TEXT,
  summary           TEXT,
  reason_text       TEXT,
  reason_text_source TEXT,    -- 'LLM_GENERATED', 'MT_GLOSSARY', 'TEMPLATE_FALLBACK'
  lang              TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS package_items (
  item_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES packages(package_id) ON DELETE CASCADE,
  seq        INT NOT NULL,
  item_type  TEXT NOT NULL,    -- 'PLACE', 'EVENT'
  ref_id     UUID,
  slot_type  TEXT              -- 'MORNING', 'LUNCH', 'AFTERNOON', 'EVENING'
);

-- ============================================================
-- 3. 사용자 세션 & 로그
-- ============================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  session_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lang           TEXT,
  city_code      TEXT,
  visit_form     TEXT,
  interests      TEXT[],        -- PostgreSQL 배열
  transport_mode TEXT,
  free_text_query TEXT,
  lat            DOUBLE PRECISION,
  lng            DOUBLE PRECISION,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recommendation_logs (
  log_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID,
  package_id   TEXT,
  action       TEXT,          -- 'IMPRESSION', 'CLICK', 'SAVE', 'OUTLINK'
  metadata     JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. 날씨 스냅샷
-- ============================================================

CREATE TABLE IF NOT EXISTS weather_snapshots (
  snapshot_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_key     TEXT NOT NULL,    -- 도시 code (e.g. 'seoul')
  weather_code TEXT,             -- 'Clear', 'Cloudy', 'Rain', 'Snow'
  temp_c       DOUBLE PRECISION,
  humidity     INT,
  forecast_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. Feature Flags & AI 감사
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  key       TEXT PRIMARY KEY,
  enabled   BOOLEAN DEFAULT false,
  metadata  JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_prompt_audit (
  audit_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purpose     TEXT,
  model       TEXT,
  input_tokens  INT,
  output_tokens INT,
  latency_ms    INT,
  success       BOOLEAN,
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. 운영시간
-- ============================================================

CREATE TABLE IF NOT EXISTS operating_hours (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id  UUID REFERENCES places(place_id) ON DELETE CASCADE,
  day_of_week INT,   -- 0=일, 1=월 ... 6=토
  open_time   TIME,
  close_time  TIME,
  closed      BOOLEAN DEFAULT false
);

-- ============================================================
-- 7. 인덱스
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_places_city ON places(city_id);
CREATE INDEX IF NOT EXISTS idx_places_type ON places(primary_type);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_weather_area ON weather_snapshots(area_key, forecast_at DESC);
CREATE INDEX IF NOT EXISTS idx_rec_logs_session ON recommendation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_city ON user_sessions(city_code);

-- ============================================================
-- 8. RPC 함수 (서버 사이드 쿼리용)
-- ============================================================

-- 8-1. 근처 장소 검색 (좌표 + 이름 유사도)
CREATE OR REPLACE FUNCTION find_nearby_places(
  target_lat DOUBLE PRECISION,
  target_lng DOUBLE PRECISION,
  radius_km  DOUBLE PRECISION DEFAULT 0.5
)
RETURNS TABLE(
  place_id UUID,
  name_ko TEXT,
  distance_km DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
  SELECT place_id, name_ko, distance_km
  FROM (
    SELECT
      p.place_id,
      p.name_ko,
      (6371 * acos(
        cos(radians(target_lat)) * cos(radians(p.lat)) *
        cos(radians(p.lng) - radians(target_lng)) +
        sin(radians(target_lat)) * sin(radians(p.lat))
      )) AS distance_km
    FROM places p
    WHERE p.lat IS NOT NULL AND p.lng IS NOT NULL
  ) AS sq
  WHERE distance_km < radius_km
  ORDER BY distance_km ASC
  LIMIT 20;
$$;

-- 8-2. 임베딩 유사도 검색 (장소)
CREATE OR REPLACE FUNCTION search_places_by_embedding(
  query_embedding vector(384),
  target_city_id UUID,
  match_count INT DEFAULT 80
)
RETURNS TABLE(
  place_id UUID,
  name TEXT,
  primary_type TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  similarity DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.place_id,
    p.name_ko AS name,
    p.primary_type,
    p.lat,
    p.lng,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM places p
  WHERE p.city_id = target_city_id
    AND p.embedding IS NOT NULL
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 8-3. 임베딩 유사도 검색 (이벤트)
CREATE OR REPLACE FUNCTION search_events_by_embedding(
  query_embedding vector(384),
  target_city_id UUID,
  match_count INT DEFAULT 40
)
RETURNS TABLE(
  event_id UUID,
  title TEXT,
  genre TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  similarity DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
  SELECT
    e.event_id,
    e.title_ko AS title,
    e.genre,
    e.lat,
    e.lng,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM events e
  WHERE e.city_id = target_city_id
    AND e.embedding IS NOT NULL
    AND e.status = 'ACTIVE'
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 8-4. KPI 패키지 메트릭
CREATE OR REPLACE FUNCTION kpi_package_metrics(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE(
  impressions BIGINT,
  clicks BIGINT,
  saves BIGINT,
  outlinks BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    COUNT(*) FILTER (WHERE action = 'IMPRESSION') AS impressions,
    COUNT(*) FILTER (WHERE action = 'CLICK') AS clicks,
    COUNT(*) FILTER (WHERE action = 'SAVE') AS saves,
    COUNT(*) FILTER (WHERE action = 'OUTLINK') AS outlinks
  FROM recommendation_logs
  WHERE created_at BETWEEN start_date AND end_date;
$$;

-- 8-5. KPI AI 메트릭
CREATE OR REPLACE FUNCTION kpi_ai_metrics(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE(
  total_calls BIGINT,
  success_count BIGINT,
  avg_latency DOUBLE PRECISION,
  avg_tokens DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
  SELECT
    COUNT(*) AS total_calls,
    COUNT(*) FILTER (WHERE success = true) AS success_count,
    AVG(latency_ms)::DOUBLE PRECISION AS avg_latency,
    AVG(input_tokens + output_tokens)::DOUBLE PRECISION AS avg_tokens
  FROM ai_prompt_audit
  WHERE created_at BETWEEN start_date AND end_date;
$$;


-- ============================================================
-- 9. 초기 시드 데이터
-- ============================================================

-- 9-1. 도시 5개
INSERT INTO cities (code, name_ko, name_en, name_ja, name_zh_cn, name_zh_tw, lat, lng) VALUES
  ('seoul',    '서울',  'Seoul',    'ソウル',    '首尔',   '首爾',   37.5665, 126.9780),
  ('busan',    '부산',  'Busan',    '釜山',      '釜山',   '釜山',   35.1796, 129.0756),
  ('gyeongju', '경주', 'Gyeongju', '慶州',      '庆州',   '慶州',   35.8562, 129.2250),
  ('jeonju',   '전주', 'Jeonju',   '全州',      '全州',   '全州',   35.8242, 127.1480),
  ('namwon',   '남원', 'Namwon',   '南原',      '南原',   '南原',   35.4164, 127.3900)
ON CONFLICT (code) DO NOTHING;

-- 9-2. 테마 8개
INSERT INTO themes (code, name_ko, name_en) VALUES
  ('HISTORY',           '역사·유산',      'History & Heritage'),
  ('TRADITIONAL_MUSIC', '전통음악·국악',  'Traditional Music'),
  ('MODERN_ART',        '현대미술',       'Modern Art'),
  ('FAMILY',            '가족·체험',      'Family & Experience'),
  ('NIGHT',             '야경·야간',      'Night Views'),
  ('WELLNESS',          '힐링·자연',      'Wellness & Nature'),
  ('FOOD',              '음식·미식',      'Food & Dining'),
  ('FESTIVAL',          '축제·이벤트',    'Festivals & Events')
ON CONFLICT (code) DO NOTHING;

-- 9-3. Feature flags 기본값
INSERT INTO feature_flags (key, enabled) VALUES
  ('ai_rerank', false),
  ('ai_reason_text', false),
  ('embedding_search', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 9-4. 서울 장소 시드
-- ============================================================
INSERT INTO places (city_id, name_ko, primary_type, lat, lng, source, source_id) VALUES
  ((SELECT city_id FROM cities WHERE code='seoul'), '경복궁',        'ATTRACTION', 37.5796, 126.9770, 'seed', 'seed-seoul-1'),
  ((SELECT city_id FROM cities WHERE code='seoul'), '국립중앙박물관', 'MUSEUM',    37.5240, 126.9804, 'seed', 'seed-seoul-2'),
  ((SELECT city_id FROM cities WHERE code='seoul'), '남산타워',      'ATTRACTION', 37.5512, 126.9882, 'seed', 'seed-seoul-3'),
  ((SELECT city_id FROM cities WHERE code='seoul'), '북촌 한옥마을', 'ATTRACTION', 37.5826, 126.9831, 'seed', 'seed-seoul-4'),
  ((SELECT city_id FROM cities WHERE code='seoul'), '덕수궁',        'ATTRACTION', 37.5658, 126.9750, 'seed', 'seed-seoul-5'),
  ((SELECT city_id FROM cities WHERE code='seoul'), '창덕궁',        'ATTRACTION', 37.5794, 126.9910, 'seed', 'seed-seoul-6'),
  ((SELECT city_id FROM cities WHERE code='seoul'), '인사동',        'ATTRACTION', 37.5741, 126.9856, 'seed', 'seed-seoul-7'),
  ((SELECT city_id FROM cities WHERE code='seoul'), '국립현대미술관', 'ART_GALLERY', 37.5788, 126.9805, 'seed', 'seed-seoul-8')
ON CONFLICT DO NOTHING;

-- 서울 장소-테마 매핑
INSERT INTO place_theme_map (place_id, theme_id)
SELECT p.place_id, t.theme_id FROM places p, themes t
WHERE p.name_ko = '경복궁' AND t.code = 'HISTORY' AND p.source_id = 'seed-seoul-1'
ON CONFLICT DO NOTHING;

INSERT INTO place_theme_map (place_id, theme_id)
SELECT p.place_id, t.theme_id FROM places p, themes t
WHERE p.name_ko = '국립중앙박물관' AND t.code = 'HISTORY' AND p.source_id = 'seed-seoul-2'
ON CONFLICT DO NOTHING;

INSERT INTO place_theme_map (place_id, theme_id)
SELECT p.place_id, t.theme_id FROM places p, themes t
WHERE p.name_ko = '국립중앙박물관' AND t.code = 'MODERN_ART' AND p.source_id = 'seed-seoul-2'
ON CONFLICT DO NOTHING;

INSERT INTO place_theme_map (place_id, theme_id)
SELECT p.place_id, t.theme_id FROM places p, themes t
WHERE p.name_ko = '남산타워' AND t.code = 'NIGHT' AND p.source_id = 'seed-seoul-3'
ON CONFLICT DO NOTHING;

INSERT INTO place_theme_map (place_id, theme_id)
SELECT p.place_id, t.theme_id FROM places p, themes t
WHERE p.name_ko = '남산타워' AND t.code = 'FAMILY' AND p.source_id = 'seed-seoul-3'
ON CONFLICT DO NOTHING;

INSERT INTO place_theme_map (place_id, theme_id)
SELECT p.place_id, t.theme_id FROM places p, themes t
WHERE p.name_ko = '북촌 한옥마을' AND t.code = 'HISTORY' AND p.source_id = 'seed-seoul-4'
ON CONFLICT DO NOTHING;

INSERT INTO place_theme_map (place_id, theme_id)
SELECT p.place_id, t.theme_id FROM places p, themes t
WHERE p.name_ko = '덕수궁' AND t.code = 'HISTORY' AND p.source_id = 'seed-seoul-5'
ON CONFLICT DO NOTHING;

INSERT INTO place_theme_map (place_id, theme_id)
SELECT p.place_id, t.theme_id FROM places p, themes t
WHERE p.name_ko = '창덕궁' AND t.code = 'HISTORY' AND p.source_id = 'seed-seoul-6'
ON CONFLICT DO NOTHING;

INSERT INTO place_theme_map (place_id, theme_id)
SELECT p.place_id, t.theme_id FROM places p, themes t
WHERE p.name_ko = '인사동' AND t.code = 'HISTORY' AND p.source_id = 'seed-seoul-7'
ON CONFLICT DO NOTHING;

INSERT INTO place_theme_map (place_id, theme_id)
SELECT p.place_id, t.theme_id FROM places p, themes t
WHERE p.name_ko = '인사동' AND t.code = 'FOOD' AND p.source_id = 'seed-seoul-7'
ON CONFLICT DO NOTHING;

INSERT INTO place_theme_map (place_id, theme_id)
SELECT p.place_id, t.theme_id FROM places p, themes t
WHERE p.name_ko = '국립현대미술관' AND t.code = 'MODERN_ART' AND p.source_id = 'seed-seoul-8'
ON CONFLICT DO NOTHING;

-- 서울 다국어
INSERT INTO place_i18n (place_id, lang, name) 
SELECT p.place_id, 'en', 'Gyeongbokgung Palace' FROM places p WHERE p.source_id = 'seed-seoul-1'
ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) 
SELECT p.place_id, 'ja', '景福宮' FROM places p WHERE p.source_id = 'seed-seoul-1'
ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) 
SELECT p.place_id, 'en', 'National Museum of Korea' FROM places p WHERE p.source_id = 'seed-seoul-2'
ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) 
SELECT p.place_id, 'ja', '国立中央博物館' FROM places p WHERE p.source_id = 'seed-seoul-2'
ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) 
SELECT p.place_id, 'en', 'Namsan Tower' FROM places p WHERE p.source_id = 'seed-seoul-3'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9-5. 부산 장소 시드
-- ============================================================
INSERT INTO places (city_id, name_ko, primary_type, lat, lng, source, source_id) VALUES
  ((SELECT city_id FROM cities WHERE code='busan'), '해운대 해수욕장',  'ATTRACTION', 35.1587, 129.1604, 'seed', 'seed-busan-1'),
  ((SELECT city_id FROM cities WHERE code='busan'), '부산박물관',       'MUSEUM',     35.1295, 129.0934, 'seed', 'seed-busan-2'),
  ((SELECT city_id FROM cities WHERE code='busan'), '감천문화마을',     'ATTRACTION', 35.0975, 129.0104, 'seed', 'seed-busan-3'),
  ((SELECT city_id FROM cities WHERE code='busan'), '광안리 해수욕장',  'ATTRACTION', 35.1532, 129.1186, 'seed', 'seed-busan-4'),
  ((SELECT city_id FROM cities WHERE code='busan'), '자갈치시장',       'ATTRACTION', 35.0968, 129.0306, 'seed', 'seed-busan-5'),
  ((SELECT city_id FROM cities WHERE code='busan'), '태종대',           'ATTRACTION', 35.0516, 129.0857, 'seed', 'seed-busan-6'),
  ((SELECT city_id FROM cities WHERE code='busan'), '용두산공원',       'ATTRACTION', 35.1010, 129.0326, 'seed', 'seed-busan-7')
ON CONFLICT DO NOTHING;

INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-busan-1' AND t.code='NIGHT' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-busan-1' AND t.code='FAMILY' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-busan-2' AND t.code='HISTORY' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-busan-3' AND t.code='MODERN_ART' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-busan-3' AND t.code='HISTORY' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-busan-4' AND t.code='NIGHT' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-busan-4' AND t.code='WELLNESS' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-busan-5' AND t.code='FOOD' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-busan-6' AND t.code='WELLNESS' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-busan-6' AND t.code='FAMILY' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-busan-7' AND t.code='NIGHT' ON CONFLICT DO NOTHING;

INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'en', 'Haeundae Beach' FROM places p WHERE p.source_id='seed-busan-1' ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'ja', '海雲台ビーチ' FROM places p WHERE p.source_id='seed-busan-1' ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'en', 'Busan Museum' FROM places p WHERE p.source_id='seed-busan-2' ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'en', 'Gamcheon Culture Village' FROM places p WHERE p.source_id='seed-busan-3' ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'en', 'Gwangalli Beach' FROM places p WHERE p.source_id='seed-busan-4' ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'en', 'Jagalchi Fish Market' FROM places p WHERE p.source_id='seed-busan-5' ON CONFLICT DO NOTHING;

-- ============================================================
-- 9-6. 경주 장소 시드
-- ============================================================
INSERT INTO places (city_id, name_ko, primary_type, lat, lng, source, source_id) VALUES
  ((SELECT city_id FROM cities WHERE code='gyeongju'), '불국사',         'ATTRACTION', 35.7901, 129.3320, 'seed', 'seed-gj-1'),
  ((SELECT city_id FROM cities WHERE code='gyeongju'), '동궁과 월지',   'ATTRACTION', 35.8348, 129.2266, 'seed', 'seed-gj-2'),
  ((SELECT city_id FROM cities WHERE code='gyeongju'), '국립경주박물관', 'MUSEUM',     35.8330, 129.2195, 'seed', 'seed-gj-3'),
  ((SELECT city_id FROM cities WHERE code='gyeongju'), '첨성대',         'ATTRACTION', 35.8346, 129.2191, 'seed', 'seed-gj-4'),
  ((SELECT city_id FROM cities WHERE code='gyeongju'), '석굴암',         'ATTRACTION', 35.7959, 129.3489, 'seed', 'seed-gj-5')
ON CONFLICT DO NOTHING;

INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-gj-1' AND t.code='HISTORY' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-gj-1' AND t.code='WELLNESS' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-gj-2' AND t.code='NIGHT' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-gj-2' AND t.code='HISTORY' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-gj-3' AND t.code='HISTORY' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-gj-4' AND t.code='HISTORY' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-gj-4' AND t.code='FAMILY' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-gj-5' AND t.code='HISTORY' ON CONFLICT DO NOTHING;

INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'en', 'Bulguksa Temple' FROM places p WHERE p.source_id='seed-gj-1' ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'en', 'Donggung Palace & Wolji Pond' FROM places p WHERE p.source_id='seed-gj-2' ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'en', 'Gyeongju National Museum' FROM places p WHERE p.source_id='seed-gj-3' ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'en', 'Cheomseongdae Observatory' FROM places p WHERE p.source_id='seed-gj-4' ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'en', 'Seokguram Grotto' FROM places p WHERE p.source_id='seed-gj-5' ON CONFLICT DO NOTHING;

-- ============================================================
-- 9-7. 전주 장소 시드
-- ============================================================
INSERT INTO places (city_id, name_ko, primary_type, lat, lng, source, source_id) VALUES
  ((SELECT city_id FROM cities WHERE code='jeonju'), '전주 한옥마을', 'ATTRACTION', 35.8147, 127.1526, 'seed', 'seed-jj-1'),
  ((SELECT city_id FROM cities WHERE code='jeonju'), '경기전',        'ATTRACTION', 35.8155, 127.1497, 'seed', 'seed-jj-2'),
  ((SELECT city_id FROM cities WHERE code='jeonju'), '남부시장',      'ATTRACTION', 35.8110, 127.1470, 'seed', 'seed-jj-3'),
  ((SELECT city_id FROM cities WHERE code='jeonju'), '전주향교',      'ATTRACTION', 35.8129, 127.1558, 'seed', 'seed-jj-4')
ON CONFLICT DO NOTHING;

INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-jj-1' AND t.code='HISTORY' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-jj-1' AND t.code='FOOD' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-jj-2' AND t.code='HISTORY' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-jj-3' AND t.code='FOOD' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-jj-3' AND t.code='FAMILY' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-jj-4' AND t.code='HISTORY' ON CONFLICT DO NOTHING;

INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'en', 'Jeonju Hanok Village' FROM places p WHERE p.source_id='seed-jj-1' ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'en', 'Gyeonggijeon Shrine' FROM places p WHERE p.source_id='seed-jj-2' ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'en', 'Nambu Market' FROM places p WHERE p.source_id='seed-jj-3' ON CONFLICT DO NOTHING;

-- ============================================================
-- 9-8. 남원 장소 시드
-- ============================================================
INSERT INTO places (city_id, name_ko, primary_type, lat, lng, source, source_id) VALUES
  ((SELECT city_id FROM cities WHERE code='namwon'), '광한루원',         'ATTRACTION', 35.4057, 127.3804, 'seed', 'seed-nw-1'),
  ((SELECT city_id FROM cities WHERE code='namwon'), '지리산 국립공원',  'ATTRACTION', 35.3371, 127.7306, 'seed', 'seed-nw-2'),
  ((SELECT city_id FROM cities WHERE code='namwon'), '춘향테마파크',    'ATTRACTION', 35.4031, 127.3838, 'seed', 'seed-nw-3')
ON CONFLICT DO NOTHING;

INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-nw-1' AND t.code='HISTORY' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-nw-1' AND t.code='NIGHT' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-nw-2' AND t.code='WELLNESS' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-nw-2' AND t.code='FAMILY' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-nw-3' AND t.code='FAMILY' ON CONFLICT DO NOTHING;
INSERT INTO place_theme_map (place_id, theme_id) SELECT p.place_id, t.theme_id FROM places p, themes t WHERE p.source_id='seed-nw-3' AND t.code='HISTORY' ON CONFLICT DO NOTHING;

INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'en', 'Gwanghalluwon Garden' FROM places p WHERE p.source_id='seed-nw-1' ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'en', 'Jirisan National Park' FROM places p WHERE p.source_id='seed-nw-2' ON CONFLICT DO NOTHING;
INSERT INTO place_i18n (place_id, lang, name) SELECT p.place_id, 'en', 'Chunhyang Theme Park' FROM places p WHERE p.source_id='seed-nw-3' ON CONFLICT DO NOTHING;

-- ============================================================
-- 9-9. 이벤트 시드
-- ============================================================
INSERT INTO events (city_id, title_ko, genre, status, start_date, end_date, source, source_id, lat, lng) VALUES
  ((SELECT city_id FROM cities WHERE code='seoul'), '전통 국악 공연',     'TRADITIONAL_MUSIC', 'ACTIVE', '2026-01-01', '2026-12-31', 'seed', 'seed-evt-seoul-1', 37.5796, 126.9770),
  ((SELECT city_id FROM cities WHERE code='seoul'), '서울빛초롱축제',     'FESTIVAL',          'ACTIVE', '2026-11-01', '2026-12-31', 'seed', 'seed-evt-seoul-2', 37.5697, 126.9772),
  ((SELECT city_id FROM cities WHERE code='busan'), '부산국제영화제',     'FESTIVAL',          'ACTIVE', '2026-10-01', '2026-10-10', 'seed', 'seed-evt-busan-1', 35.1532, 129.1186),
  ((SELECT city_id FROM cities WHERE code='busan'), '부산 원아시아페스티벌', 'FESTIVAL',        'ACTIVE', '2026-10-20', '2026-10-25', 'seed', 'seed-evt-busan-2', 35.1587, 129.1604),
  ((SELECT city_id FROM cities WHERE code='gyeongju'), '신라문화제',      'FESTIVAL',          'ACTIVE', '2026-10-10', '2026-10-15', 'seed', 'seed-evt-gj-1', 35.8346, 129.2191),
  ((SELECT city_id FROM cities WHERE code='jeonju'), '전주국제영화제',    'FESTIVAL',          'ACTIVE', '2026-04-28', '2026-05-07', 'seed', 'seed-evt-jj-1', 35.8147, 127.1526)
ON CONFLICT DO NOTHING;

INSERT INTO event_i18n (event_id, lang, title) SELECT e.event_id, 'en', 'Traditional Gugak Performance' FROM events e WHERE e.source_id='seed-evt-seoul-1' ON CONFLICT DO NOTHING;
INSERT INTO event_i18n (event_id, lang, title) SELECT e.event_id, 'en', 'Seoul Lantern Festival' FROM events e WHERE e.source_id='seed-evt-seoul-2' ON CONFLICT DO NOTHING;
INSERT INTO event_i18n (event_id, lang, title) SELECT e.event_id, 'en', 'Busan International Film Festival' FROM events e WHERE e.source_id='seed-evt-busan-1' ON CONFLICT DO NOTHING;
INSERT INTO event_i18n (event_id, lang, title) SELECT e.event_id, 'en', 'Busan One Asia Festival' FROM events e WHERE e.source_id='seed-evt-busan-2' ON CONFLICT DO NOTHING;
INSERT INTO event_i18n (event_id, lang, title) SELECT e.event_id, 'en', 'Silla Cultural Festival' FROM events e WHERE e.source_id='seed-evt-gj-1' ON CONFLICT DO NOTHING;
INSERT INTO event_i18n (event_id, lang, title) SELECT e.event_id, 'en', 'Jeonju International Film Festival' FROM events e WHERE e.source_id='seed-evt-jj-1' ON CONFLICT DO NOTHING;


-- ============================================================
-- 완료! 🎉
-- ============================================================
-- 위 스크립트를 Supabase Dashboard > SQL Editor에서 실행하면
-- 모든 테이블, 인덱스, RPC 함수, 시드 데이터가 생성됩니다.
