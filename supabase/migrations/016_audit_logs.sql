-- =============================================================================
-- CivicConnect TN — Migration 016: Audit Logs
-- =============================================================================

CREATE TABLE audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text NOT NULL,
  entity_id   uuid,
  old_value   jsonb,
  new_value   jsonb,
  ip_address  inet,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE audit_logs IS 'System-wide audit log. Immutable. Tracks all significant actions for compliance and debugging.';
COMMENT ON COLUMN audit_logs.actor_id IS 'NULL for system-initiated actions (cron, escalation).';
COMMENT ON COLUMN audit_logs.action IS 'Dot-notation action identifier, e.g. complaint.create, status.change, user.role_update.';
