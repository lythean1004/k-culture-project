CREATE TABLE weather_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_key TEXT NOT NULL,
  forecast_at TIMESTAMPTZ NOT NULL,
  precip_prob NUMERIC(4, 1),
  temp_c NUMERIC(4, 1),
  weather_code TEXT,
  dust_level TEXT,
  source_name source_name DEFAULT 'KMA',
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weather_lookup ON weather_snapshots(area_key, forecast_at);

CREATE TABLE mobility_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin_hash TEXT NOT NULL,
  dest_place_id UUID REFERENCES places(place_id),
  mode TEXT CHECK (mode IN ('WALK','TRANSIT','CAR')),
  distance_m INTEGER,
  est_minutes INTEGER,
  calc_basis TEXT,
  expires_at TIMESTAMPTZ,
  UNIQUE(origin_hash, dest_place_id, mode)
);

-- ★ V03 핵심: 임베딩 테이블 (pgvector)
-- multilingual-e5-small은 384차원, bge-m3는 1024차원
-- MVP에서는 384차원으로 시작
CREATE TABLE embeddings (
  embedding_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT CHECK (entity_type IN ('PLACE','EVENT','THEME','QUERY')),
  entity_id UUID NOT NULL,
  lang TEXT NOT NULL,
  vector vector(384),                    -- multilingual-e5-small 차원
  model_name TEXT NOT NULL,
  model_revision TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, lang, model_name)
);

CREATE INDEX idx_embeddings_vector ON embeddings 
USING hnsw (vector vector_cosine_ops);

CREATE INDEX idx_embeddings_lookup ON embeddings(entity_type, lang);

-- AI 모듈 거버넌스 테이블
CREATE TABLE model_registry (
  model_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,                -- 'gemini', 'vllm', 'huggingface'
  model_name TEXT NOT NULL,              -- 'gemini-2.0-flash-exp' 등
  revision TEXT,
  purpose TEXT NOT NULL,                 -- 'EMBEDDING','LLM','RERANKER'
  quantization TEXT,
  vram_required_gb NUMERIC(5, 1),
  license_type TEXT NOT NULL,
  commercial_use BOOLEAN DEFAULT false,
  attribution_required BOOLEAN DEFAULT false,
  benchmark_score NUMERIC(5, 2),
  activated_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE ai_prompt_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purpose TEXT NOT NULL,                 -- 'REASON_TEXT','CHAT','POST_EDIT'
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  system_prompt_version TEXT,
  input_payload JSONB,
  output JSONB,
  tokens_in INTEGER,
  tokens_out INTEGER,
  latency_ms INTEGER,
  error_code TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_lookup ON ai_prompt_audit(purpose, created_at);

CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  turn_index SMALLINT NOT NULL,
  user_message TEXT,
  assistant_response TEXT,
  tool_calls JSONB,
  latency_ms INTEGER,
  provider TEXT,
  model_name TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT,
  package_id UUID REFERENCES packages(package_id),
  feedback_type TEXT CHECK (feedback_type IN 
    ('THUMBS_UP','THUMBS_DOWN','REPORT_HALLUCINATION')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE feature_flags (
  flag_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  scope TEXT DEFAULT 'GLOBAL',
  config JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inference_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  tokens_in BIGINT DEFAULT 0,
  tokens_out BIGINT DEFAULT 0,
  latency_p50_ms INTEGER,
  latency_p95_ms INTEGER,
  error_count INTEGER DEFAULT 0,
  UNIQUE(date, provider, model_name)
);
