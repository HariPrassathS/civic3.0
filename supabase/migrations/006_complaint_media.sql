-- =============================================================================
-- CivicConnect TN — Migration 006: Complaint Media
-- =============================================================================

CREATE TABLE complaint_media (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id  uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  media_type    media_type NOT NULL,
  storage_path  text NOT NULL,
  url           text NOT NULL,
  phase         media_phase NOT NULL,
  uploaded_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ai_analysis   jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE complaint_media IS 'Media files (images, video, audio) attached to complaints during reporting or resolution.';
COMMENT ON COLUMN complaint_media.phase IS 'When the media was uploaded: initial complaint, before-fix, or after-fix evidence.';
COMMENT ON COLUMN complaint_media.ai_analysis IS 'Vision AI analysis result for resolution verification.';
