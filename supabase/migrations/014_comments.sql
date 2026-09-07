-- =============================================================================
-- CivicConnect TN — Migration 014: Comments
-- =============================================================================

CREATE TABLE comments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id  uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content       text NOT NULL CHECK (length(content) > 0),
  is_official   boolean NOT NULL DEFAULT false,
  is_hidden     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE comments IS 'Comments on public complaints. is_official marks government responses. is_hidden for moderation.';
