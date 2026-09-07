-- =============================================================================
-- CivicConnect TN — Migration 018: Row Level Security Policies
-- =============================================================================
-- RLS is the primary authorization layer. Every table accessed by user-scoped
-- queries MUST have RLS enabled.

-- -------------------------------------------------------
-- Enable RLS on all tables
-- -------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- Helper function: get current user's role from profiles
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE firebase_uid = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's profile id
CREATE OR REPLACE FUNCTION get_user_profile_id()
RETURNS uuid AS $$
  SELECT id FROM profiles WHERE firebase_uid = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- -------------------------------------------------------
-- departments: readable by all authenticated users
-- -------------------------------------------------------
CREATE POLICY departments_read ON departments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY departments_admin_write ON departments
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- -------------------------------------------------------
-- categories: readable by all authenticated users
-- -------------------------------------------------------
CREATE POLICY categories_read ON categories
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY categories_admin_write ON categories
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- -------------------------------------------------------
-- profiles
-- -------------------------------------------------------
-- Users can read their own profile
CREATE POLICY profiles_own_read ON profiles
  FOR SELECT TO authenticated
  USING (firebase_uid = auth.uid()::text);

-- Government officials can read profiles in their scope
CREATE POLICY profiles_gov_read ON profiles
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('area_officer', 'department_head', 'city_commissioner',
      'district_collector', 'department_secretary', 'chief_secretary',
      'chief_minister', 'admin')
  );

-- Users can update their own profile (limited fields — enforced in application)
CREATE POLICY profiles_own_update ON profiles
  FOR UPDATE TO authenticated
  USING (firebase_uid = auth.uid()::text)
  WITH CHECK (firebase_uid = auth.uid()::text);

-- Admin can manage all profiles
CREATE POLICY profiles_admin_write ON profiles
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- -------------------------------------------------------
-- complaints
-- -------------------------------------------------------
-- Citizens see their own complaints
CREATE POLICY complaints_citizen_own ON complaints
  FOR SELECT TO authenticated
  USING (citizen_id = get_user_profile_id());

-- Public complaints readable by anyone authenticated (community feed)
CREATE POLICY complaints_public_read ON complaints
  FOR SELECT TO authenticated
  USING (is_public = true);

-- Field workers see their active assignments
CREATE POLICY complaints_field_worker ON complaints
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'field_worker'
    AND id IN (
      SELECT complaint_id FROM complaint_assignments
      WHERE assigned_to = get_user_profile_id() AND is_active = true
    )
  );

-- Area officers see complaints in their ward
CREATE POLICY complaints_area_officer ON complaints
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'area_officer'
    AND ward = (SELECT ward_id FROM profiles WHERE firebase_uid = auth.uid()::text)
  );

-- Department heads see department complaints
CREATE POLICY complaints_dept_head ON complaints
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'department_head'
    AND department_id = (SELECT department_id FROM profiles WHERE firebase_uid = auth.uid()::text)
  );

-- Senior officials (city-wide and above) see all complaints
CREATE POLICY complaints_senior_read ON complaints
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('city_commissioner', 'district_collector',
      'department_secretary', 'chief_secretary', 'chief_minister', 'admin')
  );

-- Citizens can create complaints
CREATE POLICY complaints_citizen_create ON complaints
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'citizen'
    AND citizen_id = get_user_profile_id()
  );

-- Government officials can update complaints (status changes, assignments)
CREATE POLICY complaints_gov_update ON complaints
  FOR UPDATE TO authenticated
  USING (
    get_user_role() IN ('field_worker', 'area_officer', 'department_head',
      'city_commissioner', 'district_collector', 'department_secretary',
      'chief_secretary', 'chief_minister', 'admin')
  );

-- -------------------------------------------------------
-- complaint_media: inherits complaint access
-- -------------------------------------------------------
CREATE POLICY media_read ON complaint_media
  FOR SELECT TO authenticated
  USING (
    complaint_id IN (SELECT id FROM complaints)  -- RLS on complaints filters this
  );

CREATE POLICY media_create ON complaint_media
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = get_user_profile_id()
  );

-- -------------------------------------------------------
-- complaint_assignments
-- -------------------------------------------------------
CREATE POLICY assignments_read ON complaint_assignments
  FOR SELECT TO authenticated
  USING (
    assigned_to = get_user_profile_id()
    OR get_user_role() IN ('area_officer', 'department_head', 'city_commissioner',
      'district_collector', 'department_secretary', 'chief_secretary',
      'chief_minister', 'admin')
  );

CREATE POLICY assignments_write ON complaint_assignments
  FOR ALL TO authenticated
  USING (
    get_user_role() IN ('area_officer', 'department_head', 'admin')
  )
  WITH CHECK (
    get_user_role() IN ('area_officer', 'department_head', 'admin')
  );

-- -------------------------------------------------------
-- complaint_updates: readable by anyone who can see the complaint
-- -------------------------------------------------------
CREATE POLICY updates_read ON complaint_updates
  FOR SELECT TO authenticated
  USING (
    complaint_id IN (SELECT id FROM complaints)
  );

CREATE POLICY updates_create ON complaint_updates
  FOR INSERT TO authenticated
  WITH CHECK (
    updated_by = get_user_profile_id()
  );

-- -------------------------------------------------------
-- sla_configs: readable by govt, writable by admin
-- -------------------------------------------------------
CREATE POLICY sla_configs_read ON sla_configs
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('area_officer', 'department_head', 'city_commissioner',
      'district_collector', 'department_secretary', 'chief_secretary',
      'chief_minister', 'admin')
  );

CREATE POLICY sla_configs_admin_write ON sla_configs
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- -------------------------------------------------------
-- escalation_configs: readable by govt, writable by admin
-- -------------------------------------------------------
CREATE POLICY escalation_configs_read ON escalation_configs
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('area_officer', 'department_head', 'city_commissioner',
      'district_collector', 'department_secretary', 'chief_secretary',
      'chief_minister', 'admin')
  );

CREATE POLICY escalation_configs_admin_write ON escalation_configs
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- -------------------------------------------------------
-- escalation_logs
-- -------------------------------------------------------
CREATE POLICY escalation_logs_read ON escalation_logs
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('area_officer', 'department_head', 'city_commissioner',
      'district_collector', 'department_secretary', 'chief_secretary',
      'chief_minister', 'admin')
  );

-- -------------------------------------------------------
-- ai_insights: readable by anyone who can see the complaint
-- -------------------------------------------------------
CREATE POLICY ai_insights_read ON ai_insights
  FOR SELECT TO authenticated
  USING (
    complaint_id IS NULL  -- aggregate insights readable by govt
    OR complaint_id IN (SELECT id FROM complaints)
  );

-- -------------------------------------------------------
-- upvotes: citizens can manage their own
-- -------------------------------------------------------
CREATE POLICY upvotes_read ON upvotes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY upvotes_citizen_write ON upvotes
  FOR ALL TO authenticated
  USING (user_id = get_user_profile_id())
  WITH CHECK (user_id = get_user_profile_id());

-- -------------------------------------------------------
-- comments: readable on public complaints
-- -------------------------------------------------------
CREATE POLICY comments_read ON comments
  FOR SELECT TO authenticated
  USING (is_hidden = false);

CREATE POLICY comments_create ON comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = get_user_profile_id());

CREATE POLICY comments_admin_manage ON comments
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- -------------------------------------------------------
-- notifications: users see only their own
-- -------------------------------------------------------
CREATE POLICY notifications_own ON notifications
  FOR SELECT TO authenticated
  USING (user_id = get_user_profile_id());

CREATE POLICY notifications_own_update ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = get_user_profile_id())
  WITH CHECK (user_id = get_user_profile_id());

-- -------------------------------------------------------
-- audit_logs: admin only
-- -------------------------------------------------------
CREATE POLICY audit_logs_admin ON audit_logs
  FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');
