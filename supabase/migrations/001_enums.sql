-- =============================================================================
-- CivicConnect TN — Migration 001: Enums
-- =============================================================================
-- All PostgreSQL enum types used across the schema.
-- These must be created before any table that references them.

-- Enable PostGIS extension for geographic operations
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------
-- User roles
-- -------------------------------------------------------
CREATE TYPE user_role AS ENUM (
  'citizen',
  'field_worker',
  'area_officer',
  'department_head',
  'city_commissioner',
  'district_collector',
  'department_secretary',
  'chief_secretary',
  'chief_minister',
  'admin'
);

-- -------------------------------------------------------
-- Complaint lifecycle statuses
-- -------------------------------------------------------
CREATE TYPE complaint_status AS ENUM (
  'created',
  'ai_processing',
  'validated',
  'assigned',
  'in_progress',
  'resolution_submitted',
  'officer_verification',
  'resolved',
  'citizen_feedback',
  'closed',
  'rejected',
  'reopened',
  'escalated'
);

-- -------------------------------------------------------
-- Priority levels
-- -------------------------------------------------------
CREATE TYPE priority_level AS ENUM (
  'urgent',
  'high',
  'medium',
  'low'
);

-- -------------------------------------------------------
-- Complaint source
-- -------------------------------------------------------
CREATE TYPE complaint_source AS ENUM (
  'text',
  'voice',
  'mobile'
);

-- -------------------------------------------------------
-- Media types
-- -------------------------------------------------------
CREATE TYPE media_type AS ENUM (
  'image',
  'video',
  'audio',
  'document'
);

-- -------------------------------------------------------
-- Media upload phase
-- -------------------------------------------------------
CREATE TYPE media_phase AS ENUM (
  'complaint',
  'before_resolution',
  'after_resolution'
);

-- -------------------------------------------------------
-- Complaint update types
-- -------------------------------------------------------
CREATE TYPE update_type AS ENUM (
  'status_change',
  'note',
  'reassignment',
  'escalation',
  'verification',
  'feedback'
);

-- -------------------------------------------------------
-- AI insight types
-- -------------------------------------------------------
CREATE TYPE insight_type AS ENUM (
  'classification',
  'summary',
  'sentiment',
  'duplicate_detection',
  'safety_risk',
  'resolution_verification',
  'trend',
  'prediction'
);

-- -------------------------------------------------------
-- Notification types
-- -------------------------------------------------------
CREATE TYPE notification_type AS ENUM (
  'complaint_submitted',
  'assigned',
  'status_changed',
  'sla_warning',
  'sla_breached',
  'escalated',
  'resolved',
  'reopened',
  'verified',
  'closed'
);

-- -------------------------------------------------------
-- Notification channels
-- -------------------------------------------------------
CREATE TYPE notification_channel AS ENUM (
  'in_app',
  'email',
  'sms',
  'push'
);
