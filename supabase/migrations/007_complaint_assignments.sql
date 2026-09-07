-- =============================================================================
-- CivicConnect TN — Migration 007: Complaint Assignments
-- =============================================================================

CREATE TABLE complaint_assignments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id       uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  assigned_to        uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  assigned_by        uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  role_at_assignment text NOT NULL,
  is_active          boolean NOT NULL DEFAULT true,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE complaint_assignments IS 'Assignment history for complaints. Only one assignment per complaint should be active at a time.';
COMMENT ON COLUMN complaint_assignments.is_active IS 'Only one active assignment per complaint. Previous assignments are deactivated on reassignment.';
