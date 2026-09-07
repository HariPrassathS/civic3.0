-- =============================================================================
-- CivicConnect TN — Migration 005: Complaints
-- =============================================================================
-- Core complaints table with PostGIS geography, lifecycle status, SLA tracking.

CREATE TABLE complaints (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id            text NOT NULL,
  citizen_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  category_id            uuid REFERENCES categories(id) ON DELETE SET NULL,
  department_id          uuid REFERENCES departments(id) ON DELETE SET NULL,
  status                 complaint_status NOT NULL DEFAULT 'created',
  priority               priority_level NOT NULL DEFAULT 'medium',
  title                  text NOT NULL,
  description            text NOT NULL,
  location               geography(Point, 4326),
  address                text,
  ward                   integer,
  district               text,
  source                 complaint_source NOT NULL DEFAULT 'text',
  language               text NOT NULL DEFAULT 'en',
  is_public              boolean NOT NULL DEFAULT true,
  sla_deadline           timestamptz,
  sla_breached           boolean NOT NULL DEFAULT false,
  escalation_level       integer NOT NULL DEFAULT 0 CHECK (escalation_level >= 0 AND escalation_level <= 8),
  ai_category_confidence real,
  ai_priority_confidence real,
  ai_sentiment           text,
  resolved_at            timestamptz,
  closed_at              timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT complaints_tracking_id_unique UNIQUE (tracking_id),
  CONSTRAINT complaints_confidence_range CHECK (
    (ai_category_confidence IS NULL OR (ai_category_confidence >= 0 AND ai_category_confidence <= 1))
    AND
    (ai_priority_confidence IS NULL OR (ai_priority_confidence >= 0 AND ai_priority_confidence <= 1))
  )
);

COMMENT ON TABLE complaints IS 'Central complaints table. Every civic issue reported by a citizen lives here.';
COMMENT ON COLUMN complaints.tracking_id IS 'Human-readable ID shown to citizens, e.g. CC-TN-2026-000123.';
COMMENT ON COLUMN complaints.location IS 'PostGIS geography point (SRID 4326) for spatial queries.';
COMMENT ON COLUMN complaints.escalation_level IS '0 = not escalated, 1-8 = escalation tier.';

-- Auto-update updated_at
CREATE TRIGGER complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
