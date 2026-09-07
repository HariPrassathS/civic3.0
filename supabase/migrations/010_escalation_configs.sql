-- =============================================================================
-- CivicConnect TN — Migration 010: Escalation Configs
-- =============================================================================
-- 8-level escalation hierarchy. Configurable by admin.

CREATE TABLE escalation_configs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level             integer NOT NULL CHECK (level >= 1 AND level <= 8),
  target_role       user_role NOT NULL,
  department_id     uuid REFERENCES departments(id) ON DELETE CASCADE,
  hours_after_breach integer NOT NULL CHECK (hours_after_breach >= 0),
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),

  -- One config per level per department (or global if department_id IS NULL)
  CONSTRAINT escalation_configs_level_dept_unique UNIQUE (level, department_id)
);

COMMENT ON TABLE escalation_configs IS '8-level escalation hierarchy. Each level maps to a government role and a time threshold after SLA breach.';
