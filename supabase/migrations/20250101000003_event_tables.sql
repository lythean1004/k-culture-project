-- Event 마스터
CREATE TABLE events (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID REFERENCES cities(city_id),
  event_type event_type NOT NULL,
  title_ko TEXT NOT NULL,
  venue_place_id UUID REFERENCES places(place_id),
  source_name source_name NOT NULL,
  source_event_id TEXT NOT NULL,
  genre event_genre DEFAULT 'ETC',
  official_url TEXT,
  reservation_url TEXT,
  reservation_meta JSONB,                -- Phase 2 메타 사전 적재
  status event_status DEFAULT 'ACTIVE',
  foreigner_friendly BOOLEAN DEFAULT false,
  poster_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_name, source_event_id)
);

CREATE INDEX idx_events_city ON events(city_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_genre ON events(genre);

CREATE TABLE event_i18n (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(event_id) ON DELETE CASCADE,
  lang TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  translation_source translation_source NOT NULL DEFAULT 'MT_GLOSSARY',
  quality_grade quality_grade DEFAULT 'C',
  UNIQUE(event_id, lang)
);

CREATE TABLE event_sessions (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(event_id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  runtime_min INTEGER,
  ticket_status_hint TEXT
);

CREATE INDEX idx_event_sessions_start ON event_sessions(start_at);
