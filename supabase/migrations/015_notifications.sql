-- =============================================================================
-- CivicConnect TN — Migration 015: Notifications
-- =============================================================================

CREATE TABLE notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  complaint_id  uuid REFERENCES complaints(id) ON DELETE SET NULL,
  type          notification_type NOT NULL,
  title         text NOT NULL,
  body          text,
  channel       notification_channel NOT NULL DEFAULT 'in_app',
  is_read       boolean NOT NULL DEFAULT false,
  metadata      jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE notifications IS 'User notifications for complaint events. In-app is the core channel; email/SMS/push are optional.';
