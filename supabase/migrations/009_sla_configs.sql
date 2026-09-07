-- =============================================================================
-- CivicConnect TN — Migration 009: SLA Configs
-- =============================================================================
-- Configurable SLA rules: category + priority → resolution hours.

CREATE TABLE sla_configs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id           uuid REFERENCES categories(id) ON DELETE CASCADE,
  department_id         uuid REFERENCES departments(id) ON DELETE CASCADE,
  priority              priority_level NOT NULL,
  resolution_hours      integer NOT NULL CHECK (resolution_hours > 0),
  warning_threshold_pct integer NOT NULL DEFAULT 80 CHECK (warning_threshold_pct > 0 AND warning_threshold_pct <= 100),
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- One SLA config per category-priority pair
  CONSTRAINT sla_configs_category_priority_unique UNIQUE (category_id, priority)
);

COMMENT ON TABLE sla_configs IS 'SLA resolution time rules. Configurable by admin. Used to compute sla_deadline on complaint creation.';
COMMENT ON COLUMN sla_configs.warning_threshold_pct IS 'Percentage of SLA time after which a warning notification is sent (default: 80%).';

CREATE TRIGGER sla_configs_updated_at
  BEFORE UPDATE ON sla_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
