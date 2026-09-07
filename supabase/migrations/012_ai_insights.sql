-- =============================================================================
-- CivicConnect TN — Migration 012: AI Insights
-- =============================================================================

CREATE TABLE ai_insights (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id  uuid REFERENCES complaints(id) ON DELETE CASCADE,
  insight_type  insight_type NOT NULL,
  result        jsonb NOT NULL,
  confidence    real CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  model         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE ai_insights IS 'AI-generated insights for individual complaints or aggregate analytics. complaint_id is NULL for aggregate/trend insights.';
COMMENT ON COLUMN ai_insights.result IS 'Structured JSON output from the AI model. Schema varies by insight_type.';
COMMENT ON COLUMN ai_insights.model IS 'Model identifier, e.g. "llama-3.3-70b-versatile".';
