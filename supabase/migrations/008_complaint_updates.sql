-- =============================================================================
-- CivicConnect TN — Migration 008: Complaint Updates
-- =============================================================================
-- Immutable log of every change to a complaint. Powers the timeline view.

CREATE TABLE complaint_updates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id    uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  updated_by      uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  previous_status text,
  new_status      text,
  update_type     update_type NOT NULL,
  notes           text,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE complaint_updates IS 'Immutable timeline of all complaint changes: status transitions, notes, reassignments, escalations, verifications, feedback.';
COMMENT ON COLUMN complaint_updates.metadata IS 'Flexible JSON for update-specific data: feedback rating, reassignment reason, verification result, etc.';
