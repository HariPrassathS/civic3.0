-- =============================================================================
-- CivicConnect TN — Migration 019: Spatial Queries, Indexing & GIS Functions
-- =============================================================================
-- High-performance PostGIS functions for radius search, spatial clustering,
-- and density heatmaps.

-- 1. Ensure PostGIS extension is enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Additional Composite Spatial Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_location_public
  ON complaints USING GIST (location)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_complaints_location_status
  ON complaints USING GIST (location)
  WHERE status NOT IN ('closed', 'rejected');

-- 3. PostGIS Function: Nearby Public Complaints by Radius
CREATE OR REPLACE FUNCTION get_nearby_complaints(
  p_lat double precision,
  p_lng double precision,
  p_radius_meters double precision DEFAULT 5000,
  p_limit integer DEFAULT 50,
  p_category_id uuid DEFAULT NULL,
  p_status complaint_status DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  tracking_id text,
  title text,
  status complaint_status,
  priority priority_level,
  category_id uuid,
  department_id uuid,
  address text,
  ward integer,
  district text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_point geography;
BEGIN
  v_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;

  RETURN QUERY
  SELECT
    c.id,
    c.tracking_id,
    c.title,
    c.status,
    c.priority,
    c.category_id,
    c.department_id,
    c.address,
    c.ward,
    c.district,
    ST_Y(c.location::geometry) AS latitude,
    ST_X(c.location::geometry) AS longitude,
    ST_Distance(c.location, v_point) AS distance_meters,
    c.created_at
  FROM complaints c
  WHERE c.is_public = true
    AND c.location IS NOT NULL
    AND ST_DWithin(c.location, v_point, p_radius_meters)
    AND (p_category_id IS NULL OR c.category_id = p_category_id)
    AND (p_status IS NULL OR c.status = p_status)
  ORDER BY distance_meters ASC
  LIMIT p_limit;
END;
$$;

-- 4. PostGIS Function: Heatmap Density Points
CREATE OR REPLACE FUNCTION get_heatmap_points(
  p_min_lat double precision,
  p_min_lng double precision,
  p_max_lat double precision,
  p_max_lng double precision,
  p_department_id uuid DEFAULT NULL,
  p_is_public_only boolean DEFAULT true
)
RETURNS TABLE (
  latitude double precision,
  longitude double precision,
  weight double precision,
  priority priority_level
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_bbox geometry;
BEGIN
  v_bbox := ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326);

  RETURN QUERY
  SELECT
    ST_Y(c.location::geometry) AS latitude,
    ST_X(c.location::geometry) AS longitude,
    CASE c.priority
      WHEN 'urgent' THEN 1.0
      WHEN 'high' THEN 0.75
      WHEN 'medium' THEN 0.5
      ELSE 0.25
    END AS weight,
    c.priority
  FROM complaints c
  WHERE c.location IS NOT NULL
    AND (NOT p_is_public_only OR c.is_public = true)
    AND ST_Within(c.location::geometry, v_bbox)
    AND (p_department_id IS NULL OR c.department_id = p_department_id);
END;
$$;

COMMENT ON FUNCTION get_nearby_complaints IS 'Server-side radius search for public complaints within given meters.';
COMMENT ON FUNCTION get_heatmap_points IS 'Returns geographic points with priority-weighted intensity inside a bounding box.';
