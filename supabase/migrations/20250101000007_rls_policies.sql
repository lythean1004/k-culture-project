-- Supabase RLS 활성화
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
CREATE POLICY "Public read places" ON places FOR SELECT USING (true);
CREATE POLICY "Public read place_i18n" ON place_i18n FOR SELECT USING (true);
CREATE POLICY "Public read events" ON events FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Public read event_i18n" ON event_i18n FOR SELECT USING (true);
CREATE POLICY "Public read event_sessions" ON event_sessions FOR SELECT USING (true);
CREATE POLICY "Public read cities" ON cities FOR SELECT USING (active_flag = true);
CREATE POLICY "Public read themes" ON themes FOR SELECT USING (true);
CREATE POLICY "Public read packages" ON packages FOR SELECT USING (true);
CREATE POLICY "Public read package_items" ON package_items FOR SELECT USING (true);

-- 쓰기는 service_role만 (자동 적용됨)
-- user_sessions는 자신의 세션만 접근 가능 (Phase 2에서 정교화)
