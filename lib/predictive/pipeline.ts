// =============================================================================
// CivicConnect TN — Unified Predictive Analytics Pipeline
// =============================================================================
// Server-side predictive processing engine. Decoupled from Phase 12 DBSCAN clustering.
// Aggregates historical complaints -> Recurrence -> Velocity -> Climate multipliers
// -> Generates Potential Risks, Emerging Patterns, and Future Problem Areas.

import {
  EmergingPattern,
  FutureProblemArea,
  MethodologyNotes,
  PredictiveFilterState,
  PredictiveRisk,
  PredictiveSummary,
  RiskCategory,
  UnifiedPredictiveResponse,
} from './types';
import { calculateComplaintVelocity, getWeeklyHistogramBuckets } from './time-trends';
import { analyzeInfrastructureRecurrence } from './recurrence';
import { evaluatePredictiveRisk } from './risk-engine';
import { getCurrentTamilNaduSeason, getTamilNaduSeasonalAdvisories } from './seasonal';
import { getPredictiveRoleContext, scopePredictiveResponseByRole } from './authorization';
import { HISTORICAL_MINING_DATASET } from '@/lib/data-mining/seed-data';
import { MEMORY_COMPLAINTS } from '@/lib/complaints/service';

const METHODOLOGY_NOTES: MethodologyNotes = {
  engine_version: 'CivicPredict-TN v3.2-Probabilistic',
  probabilistic_disclaimer:
    'All analytics presented in this module represent probabilistic early-warning risk assessments based on historical recurrence and velocity metrics. Predictions are not deterministic certainties.',
  dmt_decoupling_notice:
    'DBSCAN clustering in Phase 12 identifies historical spatial density clusters and common issue groupings. This predictive module executes separate forward-looking failure trajectories, velocity acceleration, and seasonal climate correlation models.',
  climate_model_grounding:
    'Grounding: Tamil Nadu State Disaster Management & Meteorological Calendar (NE Monsoon Oct-Dec, Summer Mar-May, SW Monsoon Jun-Sep).',
};

/**
 * In-memory store for updated preventative actions (e.g. dispatched/acknowledged by officials).
 */
export const ACTION_DISPATCH_STORE = new Map<
  string,
  {
    status: 'RECOMMENDED' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'COMPLETED';
    dispatched_at?: string;
    dispatched_by?: string;
  }
>();

/**
 * Executes the full Predictive Analytics Pipeline.
 */
export function executePredictiveAnalyticsPipeline(
  externalComplaints: any[] = [],
  filters: PredictiveFilterState = {}
): UnifiedPredictiveResponse {
  const referenceDateMs = Date.now();

  // 1. DATA UNIFICATION
  const rawList: any[] = [...HISTORICAL_MINING_DATASET];

  for (const mc of MEMORY_COMPLAINTS) {
    if (!rawList.some((c) => c.tracking_id === mc.tracking_id)) {
      rawList.push(mc);
    }
  }

  for (const ec of externalComplaints) {
    if (!rawList.some((c) => c.tracking_id === ec.tracking_id)) {
      rawList.push(ec);
    }
  }

  // 2. FILTER DATA BASED ON USER FILTERS
  const filteredData = rawList.filter((item) => {
    if (filters.district && filters.district !== 'all' && item.district !== filters.district) {
      return false;
    }
    if (filters.ward && filters.ward !== 0 && item.ward !== filters.ward) {
      return false;
    }
    if (filters.departmentId && filters.departmentId !== 'all' && item.department_id !== filters.departmentId) {
      return false;
    }
    if (filters.category && filters.category !== 'all') {
      const cat = (item.category_name || item.category_id || '').toLowerCase();
      if (!cat.includes(filters.category.toLowerCase())) return false;
    }
    return true;
  });

  // 3. SPATIAL-TEMPORAL RECURRENCE EXTRACTION
  const recurrentClusters = analyzeInfrastructureRecurrence(filteredData, 0.35);

  // 4. GENERATE PREDICTIVE RISKS
  const allRisks: PredictiveRisk[] = [];

  for (const cluster of recurrentClusters) {
    const timestamps = cluster.complaints.map((c) => c.created_at || new Date().toISOString());
    const velocity = calculateComplaintVelocity(timestamps, referenceDateMs);

    const risk = evaluatePredictiveRisk({
      cluster,
      velocity,
      now: new Date(referenceDateMs),
    });

    // Check if any preventative action status was updated in dispatch store
    const updatedActions = risk.preventative_actions.map((act) => {
      const stored = ACTION_DISPATCH_STORE.get(act.id);
      if (stored) {
        return {
          ...act,
          status: stored.status,
          dispatched_at: stored.dispatched_at || act.dispatched_at,
          dispatched_by: stored.dispatched_by || act.dispatched_by,
        };
      }
      return act;
    });

    allRisks.push({
      ...risk,
      preventative_actions: updatedActions,
    });
  }

  // Filter risks by RiskLevel if filter is applied
  let filteredRisks = allRisks;
  if (filters.riskLevel && filters.riskLevel !== 'all') {
    filteredRisks = filteredRisks.filter((r) => r.risk_level === filters.riskLevel);
  }

  // Filter risks by Time Horizon if filter is applied
  if (filters.timeHorizon && filters.timeHorizon !== 'all') {
    filteredRisks = filteredRisks.filter((r) => r.projected_time_horizon === filters.timeHorizon);
  }

  // Sort risks by highest risk_score descending
  filteredRisks.sort((a, b) => b.risk_score - a.risk_score);

  // 5. EXTRACT EMERGING PATTERNS (Surging / Accelerating velocity clusters)
  const emergingPatterns: EmergingPattern[] = [];

  // Group filtered complaints by ward/locality + category to calculate velocity surges
  const groupMap = new Map<string, any[]>();
  for (const item of filteredData) {
    const loc = item.ward
      ? `Ward ${item.ward}, ${item.district}`
      : item.district || 'Tamil Nadu';
    const cat = item.category_name || item.category_id || 'General Infrastructure';
    const key = `${loc}:::${cat}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(item);
  }

  groupMap.forEach((items, key) => {
    if (items.length >= 2) {
      const [locality, category] = key.split(':::');
      const timestamps = items.map((c) => c.created_at || new Date().toISOString());
      const velocity = calculateComplaintVelocity(timestamps, referenceDateMs);
      const weeklyBuckets = getWeeklyHistogramBuckets(timestamps, referenceDateMs, 4);

      if (velocity.wow_velocity_pct >= 15 || velocity.current_period_count >= 1 || items.length >= 3) {
        let signalStrength: 'VERY_STRONG' | 'STRONG' | 'MODERATE' | 'EARLY' = 'EARLY';
        if (velocity.wow_velocity_pct >= 70 && velocity.current_period_count >= 3) {
          signalStrength = 'VERY_STRONG';
        } else if (velocity.wow_velocity_pct >= 40) {
          signalStrength = 'STRONG';
        } else if (velocity.wow_velocity_pct >= 15) {
          signalStrength = 'MODERATE';
        }

        const primary = items[0];
        const patternId = `pat-${primary.district?.toLowerCase().replace(/\s+/g, '-') || 'tn'}-${primary.ward || '0'}-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        emergingPatterns.push({
          id: patternId,
          name: `Accelerated ${category} Surge`,
          category,
          locality,
          ward: primary.ward || null,
          district: primary.district || 'Chennai',
          current_velocity_wow_pct: velocity.wow_velocity_pct,
          acceleration_rate: velocity.acceleration_rate,
          weekly_counts: weeklyBuckets,
          projected_count_next_period: Math.max(velocity.projected_next_period, Math.round(items.length * 0.4)),
          signal_strength: signalStrength,
          trend_direction: velocity.trend_direction,
          first_detected_at: items[items.length - 1].created_at || new Date().toISOString(),
          summary: `${velocity.wow_velocity_pct > 0 ? `+${velocity.wow_velocity_pct}% WoW acceleration` : 'Persistent report density'} with ${items.length} total reports (${velocity.current_period_count} in the last 7 days). Projected next week volume: ~${Math.max(velocity.projected_next_period, Math.round(items.length * 0.4))} issues.`,
        });
      }
    }
  });

  // Sort emerging patterns by velocity descending
  emergingPatterns.sort((a, b) => b.current_velocity_wow_pct - a.current_velocity_wow_pct);

  // 6. SYNTHESIZE POTENTIAL FUTURE PROBLEM AREAS
  // Micro-localities with compounded risk score >= 50 or recurrent chronic breakdown
  const futureProblemAreas: FutureProblemArea[] = [];

  for (const risk of allRisks) {
    if (risk.risk_score >= 40) {
      const activeCount = risk.historical_complaint_ids.length;

      // Extract secondary risk categories
      const secondaryRisks: string[] = [];
      if (risk.risk_category === 'DRAINAGE_FLOOD') {
        secondaryRisks.push('Road Pavement Subsidence', 'Mosquito Breeding Hazard');
      } else if (risk.risk_category === 'ROAD_DETERIORATION') {
        secondaryRisks.push('Traffic Congestion Bottleneck', 'Vehicle Axle Damage');
      } else if (risk.risk_category === 'WATER_SUPPLY_FAILURE') {
        secondaryRisks.push('Contaminated Back-Siphonage', 'Public Tanker Demand Surge');
      } else if (risk.risk_category === 'SANITATION_HEALTH') {
        secondaryRisks.push('Drain Choking by Uncollected Plastic', 'Vector Outbreak');
      } else if (risk.risk_category === 'ELECTRICAL_GRID_STRESS') {
        secondaryRisks.push('Phase Imbalance', 'Commercial Feeder Blackout');
      }

      const directives = risk.preventative_actions.map((a) => a.title);

      futureProblemAreas.push({
        id: `fpa-${risk.id}`,
        locality: risk.locality,
        ward: risk.ward,
        district: risk.district,
        latitude: risk.coordinates.lat,
        longitude: risk.coordinates.lng,
        radius_meters: 350,
        compounded_risk_score: risk.risk_score,
        risk_level: risk.risk_level,
        dominant_risk_category: risk.risk_category,
        secondary_risks: secondaryRisks,
        projected_impact_summary: risk.trigger_summary,
        preventative_directives: directives,
        active_complaint_count: activeCount,
        historical_recurrence_count: risk.risk_drivers.historical_sample_size,
      });
    }
  }

  // Sort future problem areas by compounded risk score descending
  futureProblemAreas.sort((a, b) => b.compounded_risk_score - a.compounded_risk_score);

  // 7. COMPUTE PREDICTIVE SUMMARY & KPIS
  let criticalCount = 0;
  let highCount = 0;
  let moderateCount = 0;
  let actionsRecommended = 0;
  let actionsDispatched = 0;

  // Track ward-level aggregate score
  const wardRiskMap = new Map<number, { count: number; totalScore: number; district: string; dominantCategory: string }>();

  for (const risk of allRisks) {
    if (risk.risk_level === 'CRITICAL') criticalCount++;
    else if (risk.risk_level === 'HIGH') highCount++;
    else if (risk.risk_level === 'MODERATE') moderateCount++;

    for (const action of risk.preventative_actions) {
      actionsRecommended++;
      if (action.status === 'DISPATCHED' || action.status === 'COMPLETED') {
        actionsDispatched++;
      }
    }

    if (risk.ward) {
      if (!wardRiskMap.has(risk.ward)) {
        wardRiskMap.set(risk.ward, {
          count: 0,
          totalScore: 0,
          district: risk.district,
          dominantCategory: risk.risk_category,
        });
      }
      const entry = wardRiskMap.get(risk.ward)!;
      entry.count++;
      entry.totalScore += risk.risk_score;
    }
  }

  let highestRiskWard: PredictiveSummary['highest_risk_ward'] = null;
  let maxWardAvg = 0;
  wardRiskMap.forEach((val, wardNum) => {
    const avgScore = Math.round(val.totalScore / Math.max(val.count, 1));
    if (avgScore > maxWardAvg) {
      maxWardAvg = avgScore;
      highestRiskWard = {
        ward: wardNum,
        district: val.district,
        score: avgScore,
        dominant_hazard: val.dominantCategory,
      };
    }
  });

  const seasonalAdvisories = getTamilNaduSeasonalAdvisories();
  const activeSeason = seasonalAdvisories.find((s) => s.is_active_now) || seasonalAdvisories[0];

  const summary: PredictiveSummary = {
    total_active_risks: allRisks.length,
    critical_risks_count: criticalCount,
    high_risks_count: highCount,
    moderate_risks_count: moderateCount,
    emerging_patterns_count: emergingPatterns.length,
    future_problem_areas_count: futureProblemAreas.length,
    preventative_actions_recommended: actionsRecommended,
    preventative_actions_dispatched: actionsDispatched,
    highest_risk_ward: highestRiskWard,
    dominant_seasonal_risk: activeSeason.title,
    model_confidence_index: 87, // % overall index
  };

  const initialResponse: UnifiedPredictiveResponse = {
    summary,
    risks: filteredRisks,
    emerging_patterns: emergingPatterns,
    future_problem_areas: futureProblemAreas,
    seasonal_advisories: seasonalAdvisories,
    role_context: getPredictiveRoleContext(filters.role || 'citizen'),
    methodology_notes: METHODOLOGY_NOTES,
    filters_applied: filters,
    has_data: allRisks.length > 0,
    computed_at: new Date(referenceDateMs).toISOString(),
  };

  // Scope response by requested role
  return scopePredictiveResponseByRole(initialResponse, filters.role || 'citizen');
}
