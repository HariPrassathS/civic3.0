-- =============================================================================
-- CivicConnect TN — Migration 011: Escalation Logs
-- =============================================================================

CREATE TABLE escalation_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id      uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  escalation_level  integer NOT NULL CHECK (escalation_level >= 1 AND escalation_level <= 8),
  escalated_to_role text NOT NULL,
  escalated_to_user uuid REFERENCES profiles(id) ON DELETE SET NULL,
  new_deadline      timestamptz NOT NULL,
  reason            text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE escalation_logs IS 'Immutable log of every escalation event. Preserves full audit trail.';
