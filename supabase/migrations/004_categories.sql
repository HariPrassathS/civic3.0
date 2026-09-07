-- =============================================================================
-- CivicConnect TN — Migration 004: Categories
-- =============================================================================
-- Complaint categories belonging to departments.

CREATE TABLE categories (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id    uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name             text NOT NULL,
  code             text NOT NULL,
  description      text,
  default_priority priority_level NOT NULL DEFAULT 'medium',
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT categories_code_unique UNIQUE (code)
);

COMMENT ON TABLE categories IS 'Complaint categories within departments. Each category maps to exactly one department.';
