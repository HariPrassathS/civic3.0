-- =============================================================================
-- CivicConnect TN — Migration 002: Departments
-- =============================================================================
-- Departments must exist before profiles (FK) and categories.

CREATE TABLE departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  code        text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT departments_name_unique UNIQUE (name),
  CONSTRAINT departments_code_unique UNIQUE (code)
);

COMMENT ON TABLE departments IS 'Government departments that handle civic complaints (e.g., Water Supply, Roads).';
