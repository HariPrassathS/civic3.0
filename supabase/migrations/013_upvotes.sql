-- =============================================================================
-- CivicConnect TN — Migration 013: Upvotes
-- =============================================================================

CREATE TABLE upvotes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id  uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),

  -- One upvote per user per complaint
  CONSTRAINT upvotes_user_complaint_unique UNIQUE (complaint_id, user_id)
);

COMMENT ON TABLE upvotes IS 'Community upvotes on public complaints. One per user per complaint.';
