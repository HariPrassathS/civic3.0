// =============================================================================
// CivicConnect TN — Predictive Analytics Layer Types & Contracts
// =============================================================================
// Explicitly decoupled from Phase 12 DBSCAN historical clustering.
// All predictions are probabilistic forward-looking risk indicators.

export type RiskCategory =
  | 'DRAINAGE_FLOOD'
  | 'ROAD_DETERIORATION'
  | 'SANITATION_HEALTH'
  | 'WATER_SUPPLY_FAILURE'
  | 'ELECTRICAL_GRID_STRESS'
  | 'PUBLIC_SAFETY';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'EARLY_SIGNAL';

export type ConfidenceTier = 'HIGH' | 'MODERATE' | 'EARLY_SIGNAL';

export type TimeHorizon = '7_14_DAYS' | '30_DAYS' | 'SEASONAL_WINDOW';

export type TrendDirection = 'ACCELERATING' | 'INCREASING' | 'STEADY' | 'DECLINING';

export type ClimateSeason =
  | 'NORTHEAST_MONSOON' // Oct - Dec (Heavy rain, coastal surges, urban flooding)
  | 'WINTER_POST_MONSOON' // Jan - Feb (Pongal festival, market waste, road repair window)
  | 'SUMMER_PRE_MONSOON' // Mar - May (Intense heat, potable water deficits, transformer fires)
  | 'SOUTHWEST_MONSOON'; // Jun - Sep (Intermittent rains, pothole expansion, pre-monsoon desilting)

export type ActionStatus = 'RECOMMENDED' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'COMPLETED';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RiskDrivers {
  recurrence_score: number; // 0 to 100
  velocity_score: number; // 0 to 100
  seasonal_multiplier: number; // 1.0 to 1.8
  unresolved_pressure: number; // 0 to 100
  historical_density: number; // 0 to 100
  historical_sample_size: number;
}

export interface PreventativeAction {
  id: string;
  risk_id: string;
  title: string;
  target_department: string;
  target_department_id: string;
  target_role: string;
  urgency: 'IMMEDIATE' | 'PROACTIVE' | 'ROUTINE';
  instructions: string;
  recommended_crew: string;
  equipment_needed: string[];
  target_deadline_days: number;
  status: ActionStatus;
  dispatched_at?: string;
  dispatched_by?: string;
}

export interface PredictiveRisk {
  id: string;
  title: string;
  risk_category: RiskCategory;
  risk_level: RiskLevel;
  risk_score: number; // 0 to 100
  confidence_tier: ConfidenceTier;
  confidence_pct: number; // 0 to 100
  projected_time_horizon: TimeHorizon;
  time_horizon_label: string;
  locality: string;
  ward: number | null;
  district: string;
  coordinates: Coordinates;
  trigger_summary: string;
  scientific_explanation: string;
  risk_drivers: RiskDrivers;
  historical_complaint_ids: string[];
  preventative_actions: PreventativeAction[];
  created_at: string;
}

export interface EmergingPattern {
  id: string;
  name: string;
  category: string;
  locality: string;
  ward: number | null;
  district: string;
  current_velocity_wow_pct: number;
  acceleration_rate: number;
  weekly_counts: number[];
  projected_count_next_period: number;
  signal_strength: 'VERY_STRONG' | 'STRONG' | 'MODERATE' | 'EARLY';
  trend_direction: TrendDirection;
  first_detected_at: string;
  summary: string;
}

export interface FutureProblemArea {
  id: string;
  locality: string;
  ward: number | null;
  district: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  compounded_risk_score: number; // 0 to 100
  risk_level: RiskLevel;
  dominant_risk_category: RiskCategory;
  secondary_risks: string[];
  projected_impact_summary: string;
  preventative_directives: string[];
  active_complaint_count: number;
  historical_recurrence_count: number;
}

export interface SeasonalAdvisory {
  id: string;
  season: ClimateSeason;
  season_name: string;
  active_months: string;
  is_active_now: boolean;
  vulnerability_index: number; // 0 to 100
  title: string;
  summary: string;
  affected_departments: string[];
  primary_risks: string[];
  proactive_steps: string[];
  public_guidance: string[];
}

export interface PredictiveSummary {
  total_active_risks: number;
  critical_risks_count: number;
  high_risks_count: number;
  moderate_risks_count: number;
  emerging_patterns_count: number;
  future_problem_areas_count: number;
  preventative_actions_recommended: number;
  preventative_actions_dispatched: number;
  highest_risk_ward: {
    ward: number;
    district: string;
    score: number;
    dominant_hazard: string;
  } | null;
  dominant_seasonal_risk: string;
  model_confidence_index: number;
}

export interface PredictiveFilterState {
  timeHorizon?: 'all' | TimeHorizon;
  riskLevel?: 'all' | RiskLevel;
  category?: string;
  departmentId?: string;
  district?: string;
  ward?: number;
  role?: string;
}

export interface RoleContext {
  role: string;
  view_mode: 'public' | 'tactical' | 'strategic';
  can_dispatch: boolean;
  can_view_internal_crew_allocations: boolean;
  scope_description: string;
}

export interface MethodologyNotes {
  engine_version: string;
  probabilistic_disclaimer: string;
  dmt_decoupling_notice: string;
  climate_model_grounding: string;
}

export interface UnifiedPredictiveResponse {
  summary: PredictiveSummary;
  risks: PredictiveRisk[];
  emerging_patterns: EmergingPattern[];
  future_problem_areas: FutureProblemArea[];
  seasonal_advisories: SeasonalAdvisory[];
  role_context: RoleContext;
  methodology_notes: MethodologyNotes;
  filters_applied: PredictiveFilterState;
  has_data: boolean;
  computed_at: string;
}
