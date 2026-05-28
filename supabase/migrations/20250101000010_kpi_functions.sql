-- KPI package metrics aggregation
CREATE OR REPLACE FUNCTION kpi_package_metrics(
  date_from DATE, date_to DATE, lang_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  shown_count BIGINT,
  clicked_count BIGINT,
  saved_count BIGINT,
  outlink_count BIGINT,
  ctr NUMERIC,
  adoption_rate NUMERIC
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS shown_count,
    COUNT(clicked_at)::BIGINT AS clicked_count,
    COUNT(saved_at)::BIGINT AS saved_count,
    COUNT(outlink_clicked_at)::BIGINT AS outlink_count,
    (COUNT(clicked_at)::NUMERIC / NULLIF(COUNT(*), 0))::NUMERIC AS ctr,
    ((COUNT(saved_at) + COUNT(outlink_clicked_at))::NUMERIC / 
      NULLIF(COUNT(clicked_at), 0))::NUMERIC AS adoption_rate
  FROM recommendation_logs rl
  WHERE rl.shown_at::DATE BETWEEN date_from AND date_to;
END;
$$;

-- KPI AI metrics aggregation based on audit logs
CREATE OR REPLACE FUNCTION kpi_ai_metrics(
  date_from DATE, date_to DATE
)
RETURNS TABLE (
  total_calls BIGINT,
  success_calls BIGINT,
  error_calls BIGINT,
  avg_latency_ms NUMERIC,
  avg_tokens_in NUMERIC,
  avg_tokens_out NUMERIC,
  hallucination_reports BIGINT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_calls,
    COUNT(CASE WHEN error_code IS NULL THEN 1 END)::BIGINT AS success_calls,
    COUNT(CASE WHEN error_code IS NOT NULL THEN 1 END)::BIGINT AS error_calls,
    COALESCE(AVG(latency_ms), 0)::NUMERIC AS avg_latency_ms,
    COALESCE(AVG(tokens_in), 0)::NUMERIC AS avg_tokens_in,
    COALESCE(AVG(tokens_out), 0)::NUMERIC AS avg_tokens_out,
    (SELECT COUNT(*) FROM ai_feedback WHERE feedback_type = 'REPORT_HALLUCINATION')::BIGINT AS hallucination_reports
  FROM ai_prompt_audit
  WHERE created_at::DATE BETWEEN date_from AND date_to;
END;
$$;
