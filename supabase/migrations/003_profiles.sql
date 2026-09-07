-- =============================================================================
-- CivicConnect TN — Migration 003: Profiles
-- =============================================================================
-- User profiles synced from Firebase Auth. Central identity table.

CREATE TABLE profiles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid   text NOT NULL,
  email          text NOT NULL,
  display_name   text NOT NULL,
  phone          text,
  avatar_url     text,
  role           user_role NOT NULL DEFAULT 'citizen',
  department_id  uuid REFERENCES departments(id) ON DELETE SET NULL,
  ward_id        integer,
  district       text,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profiles_firebase_uid_unique UNIQUE (firebase_uid),
  CONSTRAINT profiles_email_unique UNIQUE (email)
);

COMMENT ON TABLE profiles IS 'Application user profiles. Synced from Firebase Auth on login. Source of truth for roles and permissions.';
COMMENT ON COLUMN profiles.firebase_uid IS 'Firebase Authentication UID — used during login token exchange.';
COMMENT ON COLUMN profiles.department_id IS 'NULL for citizens. Set for government officials to scope their data access.';
COMMENT ON COLUMN profiles.ward_id IS 'Ward number for area-scoped officers.';
COMMENT ON COLUMN profiles.district IS 'District name for district-scoped officials.';

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
