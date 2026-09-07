// =============================================================================
// CivicConnect TN — Data Mining & Visual Analytics Module Types
// =============================================================================

export type PointType = 'core' | 'border' | 'noise';

export interface DataPoint {
  id: string;
  tracking_id: string;
  title: string;
  description: string;
  category_id?: string;
  category_name?: string;
  department_id?: string;
  department_name?: string;
  status: string;
  priority: string;
  address: string;
  ward: number | null;
  district: string;
  latitude: number;
  longitude: number;
  created_at: string;
  resolved_at?: string | null;
  sla_deadline?: string | null;
  sla_breached?: boolean;
  escalation_level?: number;
  upvotes_count?: number;
  // Algorithmic assignment
  point_type?: PointType;
  cluster_id?: number; // -1 for noise, >= 0 for cluster index
}

export interface DBSCANOptions {
  epsilonKm: number; // Maximum radius in kilometers (e.g., 0.5 km)
  minPts: number; // Minimum number of points to form a core cluster
  categoryWeight?: number; // Distance penalty if categories differ (0 to 1)
  timeWeight?: number; // Distance penalty based on days difference (0 to 1)
  maxDaysWindow?: number; // Temporal scaling window in days
}

export interface DBSCANCluster {
  cluster_id: number;
  name: string;
  centroid_latitude: number;
  centroid_longitude: number;
  radius_km: number;
  total_points: number;
  core_points_count: number;
  border_points_count: number;
  density_pts_per_sqkm: number;
  dominant_category: string;
  category_breakdown: Record<string, number>;
  status_breakdown: Record<string, number>;
  priority_breakdown: Record<string, number>;
  ward: number | null;
  district: string;
  earliest_complaint: string;
  latest_complaint: string;
  points: DataPoint[];
}

export interface GeographicHotspot {
  hotspot_id: string;
  cluster_id: number;
  title: string;
  locality: string;
  ward: number | null;
  district: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  complaint_count: number;
  density_score: number; // 0 to 100
  dominant_category: string;
  urgency_level: 'CRITICAL' | 'HIGH' | 'MODERATE';
  unresolved_rate_pct: number;
  sample_complaints: DataPoint[];
}

export interface CommonIssueGroup {
  group_id: string;
  cluster_id: number;
  category_name: string;
  locality: string;
  ward: number | null;
  district: string;
  complaints_count: number;
  representative_title: string;
  representative_tracking_id: string;
  linked_tracking_ids: string[];
  first_reported: string;
  latest_reported: string;
}

export interface WardTrend {
  ward: number;
  district: string;
  total_complaints: number;
  active_clusters_count: number;
  hotspot_density: number; // complaints per sqkm
  dominant_category: string;
  unresolved_count: number;
}

export interface DistrictTrend {
  district: string;
  total_complaints: number;
  clusters_count: number;
  hotspots_count: number;
  noise_points_count: number;
  dominant_category: string;
  resolution_rate_pct: number;
}

export interface CategoryDistribution {
  category_id: string;
  category_name: string;
  count: number;
  percentage: number;
  clustered_count: number;
  noise_count: number;
  avg_resolution_hours: number;
}

// -----------------------------------------------------------------------------
// VISUAL ANALYTICS CONTRACTS (LAYER 2)
// -----------------------------------------------------------------------------

export interface KPISummary {
  total_complaints: number;
  open_complaints: number;
  resolved_complaints: number;
  sla_breaches: number;
  high_urgent_complaints: number;
  avg_resolution_hours: number;
  escalated_complaints: number;
  active_hotspots: number;
  resolution_rate_pct: number;
  sla_compliance_pct: number;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  total: number;
  resolved: number;
  sla_breached: number;
  urgent_count: number;
}

export interface DepartmentMetric {
  department_id: string;
  name: string;
  code: string;
  total_assigned: number;
  resolved: number;
  pending: number;
  sla_breached: number;
  escalated: number;
  avg_resolution_hours: number;
  resolution_rate_pct: number;
  sla_compliance_pct: number;
}

export interface SLAMetric {
  sla_met_count: number;
  sla_breached_count: number;
  sla_approaching_count: number;
  compliance_pct: number;
  avg_hours_urgent: number;
  avg_hours_high: number;
  avg_hours_medium: number;
  avg_hours_low: number;
}

export interface StatusMetric {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface PriorityMetric {
  priority: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
  trend_direction: 'up' | 'down' | 'stable';
}

export interface GovernanceInsight {
  id: string;
  type: 'critical' | 'warning' | 'positive' | 'info';
  title: string;
  description: string;
  metric_value: string;
  recommendation: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  title?: string;
  priority?: string;
}

export interface AnalyticsFilterState {
  timeRange: '7d' | '30d' | '90d' | '1y' | 'all';
  departmentId?: string;
  categoryId?: string;
  priority?: string;
  status?: string;
  district?: string;
  ward?: number;
  epsilonKm?: number;
  minPts?: number;
}

export interface UnifiedAnalyticsResponse {
  summary: KPISummary;
  time_series: TimeSeriesPoint[];
  categories: CategoryDistribution[];
  departments: DepartmentMetric[];
  sla_performance: SLAMetric;
  status_distribution: StatusMetric[];
  priority_distribution: PriorityMetric[];
  governance_insights: GovernanceInsight[];
  ward_trends: WardTrend[];
  district_trends: DistrictTrend[];
  dbscan: {
    clusters: DBSCANCluster[];
    noise_points: DataPoint[];
    hotspots: GeographicHotspot[];
    common_issue_groups: CommonIssueGroup[];
    summary: {
      total_analyzed: number;
      clustered_complaints: number;
      noise_complaints: number;
      total_clusters: number;
      total_hotspots: number;
      average_cluster_size: number;
      clustering_coefficient: number;
      epsilon_km: number;
      min_pts: number;
    };
  };
  heatmap_points: HeatmapPoint[];
  filters_applied: AnalyticsFilterState;
  has_data: boolean;
  empty_message?: string;
  computed_at: string;
}
