-- =============================================================================
-- CivicConnect TN — Migration 017: Indexes
-- =============================================================================
-- Performance-critical indexes across all tables.

-- -------------------------------------------------------
-- profiles
-- -------------------------------------------------------
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_department ON profiles(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX idx_profiles_firebase_uid ON profiles(firebase_uid);

-- -------------------------------------------------------
-- categories
-- -------------------------------------------------------
CREATE INDEX idx_categories_department ON categories(department_id);

-- -------------------------------------------------------
-- complaints (most critical table for query performance)
-- -------------------------------------------------------

-- Spatial index for geographic queries (nearby, heatmap, clusters)
CREATE INDEX idx_complaints_location ON complaints USING GIST (location);

-- Status filtering (most common query pattern)
CREATE INDEX idx_complaints_status ON complaints(status);

-- Citizen's own complaints
CREATE INDEX idx_complaints_citizen ON complaints(citizen_id);

-- Department-scoped queries
CREATE INDEX idx_complaints_department ON complaints(department_id) WHERE department_id IS NOT NULL;

-- Category filtering
CREATE INDEX idx_complaints_category ON complaints(category_id) WHERE category_id IS NOT NULL;

-- SLA breach detection (cron query): unresolved + approaching/past deadline
CREATE INDEX idx_complaints_sla_deadline ON complaints(sla_deadline)
  WHERE status NOT IN ('resolved', 'closed', 'rejected')
    AND sla_deadline IS NOT NULL;

-- SLA breached complaints for escalation processing
CREATE INDEX idx_complaints_sla_breached ON complaints(sla_breached, escalation_level)
  WHERE sla_breached = true
    AND status NOT IN ('resolved', 'closed', 'rejected');

-- Tracking ID lookup (unique, but explicit index for fast lookups)
-- Already covered by UNIQUE constraint, but add for clarity
CREATE INDEX idx_complaints_created_at ON complaints(created_at DESC);

-- Ward-level filtering for area officers
CREATE INDEX idx_complaints_ward ON complaints(ward) WHERE ward IS NOT NULL;

-- District-level filtering
CREATE INDEX idx_complaints_district ON complaints(district) WHERE district IS NOT NULL;

-- Public complaints for community feed
CREATE INDEX idx_complaints_public ON complaints(is_public, created_at DESC) WHERE is_public = true;

-- -------------------------------------------------------
-- complaint_media
-- -------------------------------------------------------
CREATE INDEX idx_complaint_media_complaint ON complaint_media(complaint_id);

-- -------------------------------------------------------
-- complaint_assignments
-- -------------------------------------------------------
CREATE INDEX idx_assignments_complaint ON complaint_assignments(complaint_id);
CREATE INDEX idx_assignments_assignee ON complaint_assignments(assigned_to) WHERE is_active = true;
CREATE INDEX idx_assignments_active ON complaint_assignments(complaint_id, is_active) WHERE is_active = true;

-- -------------------------------------------------------
-- complaint_updates
-- -------------------------------------------------------
CREATE INDEX idx_updates_complaint ON complaint_updates(complaint_id, created_at DESC);

-- -------------------------------------------------------
-- escalation_logs
-- -------------------------------------------------------
CREATE INDEX idx_escalation_logs_complaint ON escalation_logs(complaint_id, created_at DESC);

-- -------------------------------------------------------
-- ai_insights
-- -------------------------------------------------------
CREATE INDEX idx_ai_insights_complaint ON ai_insights(complaint_id) WHERE complaint_id IS NOT NULL;
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);

-- -------------------------------------------------------
-- upvotes
-- -------------------------------------------------------
CREATE INDEX idx_upvotes_complaint ON upvotes(complaint_id);
CREATE INDEX idx_upvotes_user ON upvotes(user_id);

-- -------------------------------------------------------
-- comments
-- -------------------------------------------------------
CREATE INDEX idx_comments_complaint ON comments(complaint_id, created_at ASC);

-- -------------------------------------------------------
-- notifications
-- -------------------------------------------------------
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;

-- -------------------------------------------------------
-- audit_logs
-- -------------------------------------------------------
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
