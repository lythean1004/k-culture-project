-- Cities seed (5개 도시)
INSERT INTO cities (code, name_ko, name_en, name_ja, name_zh_hans, name_zh_hant, 
  lat, lng, coverage_badge, area_code) VALUES
('seoul', '서울', 'Seoul', 'ソウル', '首尔', '首爾', 37.5665, 126.9780, 'high', '1'),
('busan', '부산', 'Busan', '釜山', '釜山', '釜山', 35.1796, 129.0756, 'high', '6'),
('gyeongju', '경주', 'Gyeongju', '慶州', '庆州', '慶州', 35.8562, 129.2247, 'medium', '35'),
('jeonju', '전주', 'Jeonju', '全州', '全州', '全州', 35.8242, 127.1480, 'medium', '37'),
('namwon', '남원', 'Namwon', '南原', '南原', '南原', 35.4163, 127.3905, 'low', '37');

-- Themes seed
INSERT INTO themes (code, name_ko, name_en, name_ja, name_zh_hans, name_zh_hant) VALUES
('HISTORY', '역사·유산', 'History & Heritage', '歴史・遺産', '历史与遗产', '歷史與遺產'),
('TRADITIONAL_MUSIC', '전통음악·국악', 'Traditional Music', '伝統音楽', '传统音乐', '傳統音樂'),
('MODERN_ART', '현대미술', 'Modern Art', '現代美術', '现代艺术', '現代藝術'),
('FAMILY', '가족체험', 'Family Experience', '家族体験', '家庭体验', '家庭體驗'),
('NIGHT', '야간관광', 'Night Tour', 'ナイトツアー', '夜间游览', '夜間遊覽'),
('WELLNESS', '웰니스·자연', 'Wellness & Nature', 'ウェルネス・自然', '健康与自然', '健康與自然'),
('FOOD', '로컬미식', 'Local Food', 'ローカルグルメ', '本地美食', '本地美食'),
('FESTIVAL', '축제·시즌', 'Festivals', 'フェスティバル', '节庆', '節慶');

-- Model registry seed
INSERT INTO model_registry (provider, model_name, purpose, license_type, 
  commercial_use, activated_at, notes) VALUES
('gemini', 'gemini-2.0-flash-exp', 'LLM', 'Google Terms', true, NOW(), 
  'Free tier: 15 RPM, 1500 RPD'),
('gemini', 'gemini-1.5-flash-8b', 'LLM', 'Google Terms', true, NOW(), 
  'Fallback when quota exceeded'),
('huggingface', 'intfloat/multilingual-e5-small', 'EMBEDDING', 'MIT', true, NOW(), 
  '384 dim, CPU-friendly'),
('huggingface', 'BAAI/bge-m3', 'EMBEDDING', 'MIT', true, NULL, 
  '1024 dim, Phase 1.5+ upgrade target');

-- Feature flags seed
INSERT INTO feature_flags (key, enabled, config) VALUES
('ai_reason_text', true, '{"max_tokens": 200}'),
('ai_rerank', true, '{"weight": 0.1}'),
('ai_chat_assistant', false, '{"max_turns": 10}'),
('ai_translation_postedit', false, '{"batch_size": 50}'),
('ai_collaborative_signal', false, '{}');

-- License registry seed
INSERT INTO license_registry (source_name, dataset_name, license_type, 
  ci_use_forbidden, notes) VALUES
('TOURAPI', 'tourapi_basic', 'KOGL_TYPE_1', true, 'CI/BI 사용 금지, 인격권 침해 금지'),
('KOPIS', 'kopis_performance', 'KOGL_TYPE_1', false, 'Attribution 권장'),
('MUSEUM_STD', 'museum_standard', 'KOGL_TYPE_1', false, ''),
('KMA', 'kma_forecast', 'KOGL_TYPE_4', false, 'Type 4: 변경금지');
