-- =============================================================================
-- CivicConnect TN — Seed Data
-- =============================================================================
-- Default departments, categories, SLA configs, and escalation hierarchy.
-- Run after all migrations.

-- -------------------------------------------------------
-- Departments
-- -------------------------------------------------------
INSERT INTO departments (id, name, code, description) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'Water Supply', 'WATER', 'Water supply and distribution'),
  ('d0000001-0000-0000-0000-000000000002', 'Roads & Infrastructure', 'ROADS', 'Roads, bridges, and public infrastructure'),
  ('d0000001-0000-0000-0000-000000000003', 'Sanitation & Waste', 'SANITATION', 'Garbage collection, waste management, and sanitation'),
  ('d0000001-0000-0000-0000-000000000004', 'Drainage & Sewage', 'DRAINAGE', 'Storm water drainage and sewage systems'),
  ('d0000001-0000-0000-0000-000000000005', 'Street Lighting', 'STREETLIGHT', 'Street lights and public lighting'),
  ('d0000001-0000-0000-0000-000000000006', 'Electricity', 'ELECTRICITY', 'Electrical infrastructure and power supply'),
  ('d0000001-0000-0000-0000-000000000007', 'Public Health', 'HEALTH', 'Public health and hygiene'),
  ('d0000001-0000-0000-0000-000000000008', 'General Administration', 'GENERAL', 'General civic issues and administration');

-- -------------------------------------------------------
-- Categories
-- -------------------------------------------------------

-- Water Supply
INSERT INTO categories (department_id, name, code, default_priority) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'No Water Supply', 'WATER_NO_SUPPLY', 'high'),
  ('d0000001-0000-0000-0000-000000000001', 'Low Water Pressure', 'WATER_LOW_PRESSURE', 'medium'),
  ('d0000001-0000-0000-0000-000000000001', 'Water Contamination', 'WATER_CONTAMINATION', 'urgent'),
  ('d0000001-0000-0000-0000-000000000001', 'Pipe Leakage', 'WATER_PIPE_LEAK', 'high'),
  ('d0000001-0000-0000-0000-000000000001', 'Irregular Supply', 'WATER_IRREGULAR', 'medium');

-- Roads & Infrastructure
INSERT INTO categories (department_id, name, code, default_priority) VALUES
  ('d0000001-0000-0000-0000-000000000002', 'Pothole', 'ROADS_POTHOLE', 'high'),
  ('d0000001-0000-0000-0000-000000000002', 'Road Damage', 'ROADS_DAMAGE', 'medium'),
  ('d0000001-0000-0000-0000-000000000002', 'Footpath Damage', 'ROADS_FOOTPATH', 'low'),
  ('d0000001-0000-0000-0000-000000000002', 'Bridge Issue', 'ROADS_BRIDGE', 'urgent'),
  ('d0000001-0000-0000-0000-000000000002', 'Road Construction Delay', 'ROADS_CONSTRUCTION', 'medium');

-- Sanitation & Waste
INSERT INTO categories (department_id, name, code, default_priority) VALUES
  ('d0000001-0000-0000-0000-000000000003', 'Garbage Not Collected', 'SANIT_NO_COLLECT', 'high'),
  ('d0000001-0000-0000-0000-000000000003', 'Overflowing Dustbin', 'SANIT_OVERFLOW', 'medium'),
  ('d0000001-0000-0000-0000-000000000003', 'Illegal Dumping', 'SANIT_ILLEGAL_DUMP', 'high'),
  ('d0000001-0000-0000-0000-000000000003', 'Dead Animal Removal', 'SANIT_DEAD_ANIMAL', 'urgent'),
  ('d0000001-0000-0000-0000-000000000003', 'Public Toilet Maintenance', 'SANIT_TOILET', 'medium');

-- Drainage & Sewage
INSERT INTO categories (department_id, name, code, default_priority) VALUES
  ('d0000001-0000-0000-0000-000000000004', 'Blocked Drain', 'DRAIN_BLOCKED', 'high'),
  ('d0000001-0000-0000-0000-000000000004', 'Sewage Overflow', 'DRAIN_SEWAGE', 'urgent'),
  ('d0000001-0000-0000-0000-000000000004', 'Waterlogging', 'DRAIN_WATERLOG', 'high'),
  ('d0000001-0000-0000-0000-000000000004', 'Manhole Issue', 'DRAIN_MANHOLE', 'urgent');

-- Street Lighting
INSERT INTO categories (department_id, name, code, default_priority) VALUES
  ('d0000001-0000-0000-0000-000000000005', 'Light Not Working', 'LIGHT_NOT_WORKING', 'medium'),
  ('d0000001-0000-0000-0000-000000000005', 'Damaged Pole', 'LIGHT_DAMAGED_POLE', 'high'),
  ('d0000001-0000-0000-0000-000000000005', 'New Light Request', 'LIGHT_NEW_REQUEST', 'low'),
  ('d0000001-0000-0000-0000-000000000005', 'Electrical Hazard', 'LIGHT_HAZARD', 'urgent');

-- Electricity
INSERT INTO categories (department_id, name, code, default_priority) VALUES
  ('d0000001-0000-0000-0000-000000000006', 'Power Outage', 'ELEC_OUTAGE', 'urgent'),
  ('d0000001-0000-0000-0000-000000000006', 'Transformer Issue', 'ELEC_TRANSFORMER', 'high'),
  ('d0000001-0000-0000-0000-000000000006', 'Exposed Wiring', 'ELEC_EXPOSED_WIRE', 'urgent'),
  ('d0000001-0000-0000-0000-000000000006', 'Voltage Fluctuation', 'ELEC_VOLTAGE', 'medium');

-- Public Health
INSERT INTO categories (department_id, name, code, default_priority) VALUES
  ('d0000001-0000-0000-0000-000000000007', 'Mosquito Breeding', 'HEALTH_MOSQUITO', 'high'),
  ('d0000001-0000-0000-0000-000000000007', 'Stagnant Water', 'HEALTH_STAGNANT', 'medium'),
  ('d0000001-0000-0000-0000-000000000007', 'Food Safety Concern', 'HEALTH_FOOD', 'high');

-- General Administration
INSERT INTO categories (department_id, name, code, default_priority) VALUES
  ('d0000001-0000-0000-0000-000000000008', 'Encroachment', 'GEN_ENCROACH', 'medium'),
  ('d0000001-0000-0000-0000-000000000008', 'Noise Pollution', 'GEN_NOISE', 'low'),
  ('d0000001-0000-0000-0000-000000000008', 'Public Nuisance', 'GEN_NUISANCE', 'medium'),
  ('d0000001-0000-0000-0000-000000000008', 'Other', 'GEN_OTHER', 'low');

-- -------------------------------------------------------
-- Default SLA Configs (global — NULL category_id)
-- -------------------------------------------------------
INSERT INTO sla_configs (category_id, department_id, priority, resolution_hours, warning_threshold_pct) VALUES
  (NULL, NULL, 'urgent', 12, 70),
  (NULL, NULL, 'high', 24, 80),
  (NULL, NULL, 'medium', 48, 80),
  (NULL, NULL, 'low', 72, 80);

-- -------------------------------------------------------
-- Default Escalation Hierarchy (global — NULL department_id)
-- -------------------------------------------------------
INSERT INTO escalation_configs (level, target_role, department_id, hours_after_breach) VALUES
  (1, 'area_officer', NULL, 0),
  (2, 'department_head', NULL, 6),
  (3, 'city_commissioner', NULL, 12),
  (4, 'district_collector', NULL, 24),
  (5, 'department_secretary', NULL, 48),
  (6, 'chief_secretary', NULL, 72),
  (7, 'chief_minister', NULL, 96),
  (8, 'admin', NULL, 120);
