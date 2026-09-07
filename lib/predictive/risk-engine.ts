// =============================================================================
// CivicConnect TN — Predictive Multi-Factor Risk Scoring Engine
// =============================================================================
// Synthesizes time trends, recurrence, seasonal indices, and unresolved burdens
// into probabilistic risk assessments with actionable preventative directives.

import {
  ConfidenceTier,
  PredictiveRisk,
  PreventativeAction,
  RiskCategory,
  RiskDrivers,
  RiskLevel,
  TimeHorizon,
} from './types';
import { getSeasonalCategoryMultiplier } from './seasonal';
import { VelocityResult } from './time-trends';
import { RecurrentLocationCluster } from './recurrence';

export interface EvaluateRiskInput {
  cluster: RecurrentLocationCluster;
  velocity: VelocityResult;
  now?: Date;
}

/**
 * Evaluates probabilistic risk score and generates full PredictiveRisk entity.
 */
export function evaluatePredictiveRisk(input: EvaluateRiskInput): PredictiveRisk {
  const { cluster, velocity, now = new Date() } = input;
  const categoryStr = (cluster.category || '').toUpperCase();

  // Determine standard RiskCategory
  let riskCategory: RiskCategory = 'PUBLIC_SAFETY';
  if (categoryStr.includes('DRAIN') || categoryStr.includes('FLOOD') || categoryStr.includes('SEWAGE')) {
    riskCategory = 'DRAINAGE_FLOOD';
  } else if (categoryStr.includes('ROAD') || categoryStr.includes('POTHOLE') || categoryStr.includes('PAVEMENT')) {
    riskCategory = 'ROAD_DETERIORATION';
  } else if (categoryStr.includes('GARBAGE') || categoryStr.includes('WASTE') || categoryStr.includes('SANITATION') || categoryStr.includes('HEALTH')) {
    riskCategory = 'SANITATION_HEALTH';
  } else if (categoryStr.includes('WATER') || categoryStr.includes('PIPE') || categoryStr.includes('CONTAMINATION')) {
    riskCategory = 'WATER_SUPPLY_FAILURE';
  } else if (categoryStr.includes('ELECTRIC') || categoryStr.includes('LIGHT') || categoryStr.includes('TRANSFORMER') || categoryStr.includes('POWER')) {
    riskCategory = 'ELECTRICAL_GRID_STRESS';
  }

  // 1. Recurrence Factor (0 to 100)
  const recurrenceScore = cluster.recurrence_score;

  // 2. Velocity Score (0 to 100)
  // Positive WoW velocity scaled to 0-100
  const velocityScore = Math.min(100, Math.max(0, Math.round(velocity.wow_velocity_pct * 0.7 + velocity.current_period_count * 8)));

  // 3. Seasonal Multiplier (1.0 to 1.7)
  const seasonalMultiplier = getSeasonalCategoryMultiplier(riskCategory);
  const seasonalScore = Math.min(100, Math.round((seasonalMultiplier - 1.0) * 140));

  // 4. Unresolved Pressure Score (0 to 100)
  const unresolvedRatio = cluster.total_count > 0 ? cluster.unresolved_count / cluster.total_count : 0;
  const unresolvedScore = Math.round(unresolvedRatio * 100);

  // 5. Severity/Urgency Score from historical priority
  let urgentCount = 0;
  for (const c of cluster.complaints) {
    const p = (c.priority || '').toLowerCase();
    if (p === 'urgent' || p === 'high') urgentCount++;
  }
  const severityScore = cluster.total_count > 0 ? Math.round((urgentCount / cluster.total_count) * 100) : 30;

  // Multi-factor weighted probabilistic calculation:
  // Weighted base = 0.30*rec + 0.25*vel + 0.20*seas + 0.15*unres + 0.10*sev
  const rawBase =
    0.30 * recurrenceScore +
    0.25 * velocityScore +
    0.20 * seasonalScore +
    0.15 * unresolvedScore +
    0.10 * severityScore;

  // Apply seasonal boost to aggregate
  const boostedScore = rawBase * (0.85 + (seasonalMultiplier - 1.0) * 0.4);
  const riskScore = Math.min(100, Math.max(12, Math.round(boostedScore)));

  // Determine Risk Level
  let riskLevel: RiskLevel = 'EARLY_SIGNAL';
  if (riskScore >= 75) {
    riskLevel = 'CRITICAL';
  } else if (riskScore >= 52) {
    riskLevel = 'HIGH';
  } else if (riskScore >= 32) {
    riskLevel = 'MODERATE';
  }

  // Determine Confidence Tier & Percentage
  const sampleSize = cluster.total_count;
  let confidenceTier: ConfidenceTier = 'EARLY_SIGNAL';
  let confidencePct = 45;

  if (sampleSize >= 5 && (recurrenceScore >= 60 || velocityScore >= 60)) {
    confidenceTier = 'HIGH';
    confidencePct = Math.min(94, 75 + Math.round(sampleSize * 2.5));
  } else if (sampleSize >= 3 || recurrenceScore >= 45) {
    confidenceTier = 'MODERATE';
    confidencePct = Math.min(74, 55 + Math.round(sampleSize * 3));
  } else {
    confidenceTier = 'EARLY_SIGNAL';
    confidencePct = Math.min(54, 35 + Math.round(sampleSize * 4));
  }

  // Determine Projected Time Horizon
  let timeHorizon: TimeHorizon = '30_DAYS';
  let timeHorizonLabel = 'Next 30 Days';

  if (riskLevel === 'CRITICAL' || velocity.is_surging || velocity.trend_direction === 'ACCELERATING') {
    timeHorizon = '7_14_DAYS';
    timeHorizonLabel = 'Immediate (7 – 14 Days)';
  } else if (seasonalMultiplier >= 1.4 && (riskCategory === 'DRAINAGE_FLOOD' || riskCategory === 'WATER_SUPPLY_FAILURE')) {
    timeHorizon = 'SEASONAL_WINDOW';
    timeHorizonLabel = 'Active Seasonal Window';
  }

  // Generate Titles, Summaries & Explanations based on Category & Evidence
  const { title, triggerSummary, scientificExplanation, preventativeActions } = generateRiskNarrativesAndDirectives({
    riskCategory,
    riskLevel,
    locality: cluster.locality,
    ward: cluster.ward,
    district: cluster.district,
    totalCount: cluster.total_count,
    unresolvedCount: cluster.unresolved_count,
    velocityPct: velocity.wow_velocity_pct,
    seasonalMultiplier,
    avgDaysBetween: cluster.average_days_between_complaints,
  });

  const drivers: RiskDrivers = {
    recurrence_score: recurrenceScore,
    velocity_score: velocityScore,
    seasonal_multiplier: seasonalMultiplier,
    unresolved_pressure: unresolvedScore,
    historical_density: Math.min(100, Math.round(cluster.total_count * 18)),
    historical_sample_size: cluster.total_count,
  };

  const cleanLocality = cluster.locality.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24);
  const cleanCategory = riskCategory.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const riskId = `risk-${cluster.district.toLowerCase().replace(/\s+/g, '-')}-${cluster.ward || 'gen'}-${cleanLocality}-${cleanCategory}`;

  // Attach unique risk ID to actions
  const actionsWithId = preventativeActions.map((a, idx) => ({
    ...a,
    id: `act-${riskId}-${idx + 1}`,
    risk_id: riskId,
  }));

  return {
    id: riskId,
    title,
    risk_category: riskCategory,
    risk_level: riskLevel,
    risk_score: riskScore,
    confidence_tier: confidenceTier,
    confidence_pct: confidencePct,
    projected_time_horizon: timeHorizon,
    time_horizon_label: timeHorizonLabel,
    locality: cluster.locality,
    ward: cluster.ward,
    district: cluster.district,
    coordinates: {
      lat: cluster.centroid_lat,
      lng: cluster.centroid_lng,
    },
    trigger_summary: triggerSummary,
    scientific_explanation: scientificExplanation,
    risk_drivers: drivers,
    historical_complaint_ids: cluster.complaints.map((c) => c.tracking_id || c.id),
    preventative_actions: actionsWithId,
    created_at: now.toISOString(),
  };
}

/**
 * Generates tailored explanations and preventative operational directives for officials.
 */
function generateRiskNarrativesAndDirectives(params: {
  riskCategory: RiskCategory;
  riskLevel: RiskLevel;
  locality: string;
  ward: number | null;
  district: string;
  totalCount: number;
  unresolvedCount: number;
  velocityPct: number;
  seasonalMultiplier: number;
  avgDaysBetween: number;
}): {
  title: string;
  triggerSummary: string;
  scientificExplanation: string;
  preventativeActions: Omit<PreventativeAction, 'id' | 'risk_id'>[];
} {
  const {
    riskCategory,
    locality,
    ward,
    district,
    totalCount,
    unresolvedCount,
    velocityPct,
    seasonalMultiplier,
    avgDaysBetween,
  } = params;

  const wardText = ward ? `Ward ${ward}` : `${district} Zone`;

  switch (riskCategory) {
    case 'DRAINAGE_FLOOD':
      return {
        title: `Potential Inundation & Culvert Choking Risk at ${locality}`,
        triggerSummary: `${totalCount} repeat drainage blockages recorded (averaging every ${avgDaysBetween} days) with ${unresolvedCount} active open points and ${seasonalMultiplier > 1.2 ? 'high monsoon vulnerability' : 'steady inflow'}.`,
        scientificExplanation: `Hydraulic backflow occurs when sediment and solid debris obstruct micro-drain cross-sections during rainfall surges. With ${velocityPct > 0 ? `a +${velocityPct}% weekly complaint velocity surge` : 'chronic repeat reports'}, runoff will overflow onto road sub-bases, leading to local inundation and road base erosion.`,
        preventativeActions: [
          {
            title: `Pre-Monsoon Micro-Canal Desilting & Culvert Clearing`,
            target_department: 'Drainage & Sewage',
            target_department_id: 'd0000001-0000-0000-0000-000000000004',
            target_role: 'area_officer',
            urgency: 'IMMEDIATE',
            instructions: `Deploy mechanical super-sucker truck to desilt the 350m culvert line along ${locality}. Inspect outfalls into primary canal.`,
            recommended_crew: '1 Area Engineer + 4 Drainage Field Technicians',
            equipment_needed: ['Super Sucker Jetting Machine', '50HP Dewatering Pump', 'Safety Gas Detectors'],
            target_deadline_days: 3,
            status: 'RECOMMENDED',
          },
          {
            title: `Pre-Position Emergency Dewatering Pump`,
            target_department: 'Drainage & Sewage',
            target_department_id: 'd0000001-0000-0000-0000-000000000004',
            target_role: 'field_worker',
            urgency: 'PROACTIVE',
            instructions: `Pre-stage 1x portable 25HP diesel pump at ${locality} low point to prevent inundation during sudden squalls.`,
            recommended_crew: '2 Field Operators',
            equipment_needed: ['25HP Diesel Pump', '100m Flexible Discharge Hose'],
            target_deadline_days: 5,
            status: 'RECOMMENDED',
          },
        ],
      };

    case 'ROAD_DETERIORATION':
      return {
        title: `Potential Road Surface Structural Deterioration at ${locality}`,
        triggerSummary: `Increasing pothole complaints (${totalCount} reports, ${velocityPct > 0 ? `+${velocityPct}% WoW acceleration` : 'recurrent cratering'}) indicating sub-base moisture saturation.`,
        scientificExplanation: `Continuous heavy vehicle axle loads combined with micro-pavement cracks allow water ingress into the Wet Mix Macadam (WMM) base. Without proactive sealing, localized potholes will expand into continuous asphalt disintegration and traffic hazard craters.`,
        preventativeActions: [
          {
            title: `Sub-Base Inspection & Cold/Hot Mix Patching`,
            target_department: 'Roads & Infrastructure',
            target_department_id: 'd0000001-0000-0000-0000-000000000002',
            target_role: 'area_officer',
            urgency: 'IMMEDIATE',
            instructions: `Execute milling and bitumen patch-mix restoration covering the 200m damaged stretch at ${locality}. Compact with 8-ton vibratory roller.`,
            recommended_crew: '1 Highway Supervisor + 6 Road Gang Workers',
            equipment_needed: ['Asphalt Hot-Mix Batch', '8-Ton Vibratory Roller', 'Bitumen Emulsion Sprayer'],
            target_deadline_days: 4,
            status: 'RECOMMENDED',
          },
        ],
      };

    case 'SANITATION_HEALTH':
      return {
        title: `Potential Sanitation Hazard & Vector-Borne Breeding Risk at ${locality}`,
        triggerSummary: `Cluster of ${totalCount} uncollected solid waste and stagnant waste reports with ${unresolvedCount} pending clearance points.`,
        scientificExplanation: `Accumulation of uncollected municipal solid waste in humid conditions accelerates anaerobic decomposition, generating leachate runoff that contaminates local groundwater and creates prime vector breeding sites for Aedes mosquitoes.`,
        preventativeActions: [
          {
            title: `Intensive Waste Evacuation & Bleaching Drive`,
            target_department: 'Sanitation & Waste',
            target_department_id: 'd0000001-0000-0000-0000-000000000003',
            target_role: 'area_officer',
            urgency: 'IMMEDIATE',
            instructions: `Dispatch 2x refuse compactor trucks for complete corner clearing at ${locality}. Apply bleaching powder and larvicide within 20m radius.`,
            recommended_crew: '1 Sanitary Inspector + 8 Conservancy Staff',
            equipment_needed: ['Hydraulic Refuse Compactor', 'Bleaching Powder (50kg)', 'Thermal Fogger'],
            target_deadline_days: 2,
            status: 'RECOMMENDED',
          },
        ],
      };

    case 'WATER_SUPPLY_FAILURE':
      return {
        title: `Potential Potable Supply Interruption & Pipeline Burst Risk at ${locality}`,
        triggerSummary: `${totalCount} recurrent water supply disruption/leakage reports indicating localized pipeline pressure instability.`,
        scientificExplanation: `Water hammer shocks and aging Cast Iron / PVC distribution lines under fluctuating pressure cycles induce micro-fractures at pipe joints. Unrepaired small leaks lead to pressure drop and contamination ingress into drinking water mains.`,
        preventativeActions: [
          {
            title: `Acoustic Pipe Leak Audit & Joint Pressure Stabilization`,
            target_department: 'Water Supply',
            target_department_id: 'd0000001-0000-0000-0000-000000000001',
            target_role: 'area_officer',
            urgency: 'PROACTIVE',
            instructions: `Conduct electronic acoustic leak detection along the main distribution feeder at ${locality}. Replace faulty collar couplings.`,
            recommended_crew: '1 Metro Water Assistant Engineer + 3 Pipeline Fitters',
            equipment_needed: ['Acoustic Ground Microphone', 'Pipe Clamps & Couplings', 'Water Pressure Gauge'],
            target_deadline_days: 3,
            status: 'RECOMMENDED',
          },
        ],
      };

    case 'ELECTRICAL_GRID_STRESS':
      return {
        title: `Potential Transformer Overload & Feeder Trip Risk at ${locality}`,
        triggerSummary: `${totalCount} voltage fluctuation and low-hanging wire complaints indicating distribution transformer strain.`,
        scientificExplanation: `Peak ambient temperatures and un-balanced phase loads cause transformer winding oil temperatures to exceed rated thresholds, causing sudden thermal fuse blowouts and localized blackout cascades.`,
        preventativeActions: [
          {
            title: `Thermal Infrared Scan & Transformer Phase Balancing`,
            target_department: 'Electricity',
            target_department_id: 'd0000001-0000-0000-0000-000000000006',
            target_role: 'area_officer',
            urgency: 'IMMEDIATE',
            instructions: `Perform thermal infrared camera scan of 11kV transformer bushings and low-tension distribution box at ${locality}. Balance phase loads.`,
            recommended_crew: '1 TANGEDCO Junior Engineer + 2 Linemen',
            equipment_needed: ['Thermal Imaging FLIR Camera', 'Insulated Boom Lift', 'Digital Clamp Meter'],
            target_deadline_days: 2,
            status: 'RECOMMENDED',
          },
        ],
      };

    default:
      return {
        title: `Potential Public Infrastructure Breakdown Risk at ${locality}`,
        triggerSummary: `${totalCount} repeat civic reports indicating emerging strain in ${wardText}.`,
        scientificExplanation: `Chronic repeat incident frequency signals structural degradation requiring preventive municipal inspection before critical service failure.`,
        preventativeActions: [
          {
            title: `Ward Infrastructure Multi-Point Inspection`,
            target_department: 'General Administration',
            target_department_id: 'd0000001-0000-0000-0000-000000000008',
            target_role: 'area_officer',
            urgency: 'ROUTINE',
            instructions: `Perform comprehensive site visit at ${locality} to audit civic assets and report corrective steps.`,
            recommended_crew: '1 Area Officer',
            equipment_needed: ['Inspection Tablet', 'GPS Geo-Tagger'],
            target_deadline_days: 5,
            status: 'RECOMMENDED',
          },
        ],
      };
  }
}
