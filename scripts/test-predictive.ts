// =============================================================================
// CivicConnect TN — Predictive Analytics Layer Test Suite
// =============================================================================
// Run with: npx tsx scripts/test-predictive.ts

import { calculateComplaintVelocity, getWeeklyHistogramBuckets } from '../lib/predictive/time-trends';
import { analyzeInfrastructureRecurrence } from '../lib/predictive/recurrence';
import {
  getCurrentTamilNaduSeason,
  getSeasonalCategoryMultiplier,
  getTamilNaduSeasonalAdvisories,
} from '../lib/predictive/seasonal';
import { evaluatePredictiveRisk } from '../lib/predictive/risk-engine';
import { getPredictiveRoleContext, scopePredictiveResponseByRole } from '../lib/predictive/authorization';
import { executePredictiveAnalyticsPipeline, ACTION_DISPATCH_STORE } from '../lib/predictive/pipeline';
import { HISTORICAL_MINING_DATASET } from '../lib/data-mining/seed-data';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  \x1b[32m✔\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖\x1b[0m ${testName} ${details ? `— ${details}` : ''}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('  CIVICCONNECT TN — PHASE 13 PREDICTIVE ANALYTICS TEST SUITE');
  console.log('================================================================\n');

  const nowMs = Date.now();
  const ONE_DAY = 24 * 3600 * 1000;

  // ---------------------------------------------------------------------------
  // 1. TIME TRENDS & VELOCITY ENGINE
  // ---------------------------------------------------------------------------
  console.log('[TEST GROUP 1] Time Trends, Growth Velocity (dN/dt) & Forecast');

  // Generate a surging timestamp sequence: 6 complaints in last 7 days vs 2 in prior week
  const surgingTimestamps = [
    new Date(nowMs - 1 * ONE_DAY).toISOString(),
    new Date(nowMs - 2 * ONE_DAY).toISOString(),
    new Date(nowMs - 3 * ONE_DAY).toISOString(),
    new Date(nowMs - 4 * ONE_DAY).toISOString(),
    new Date(nowMs - 5 * ONE_DAY).toISOString(),
    new Date(nowMs - 6 * ONE_DAY).toISOString(),
    new Date(nowMs - 9 * ONE_DAY).toISOString(),
    new Date(nowMs - 12 * ONE_DAY).toISOString(),
    new Date(nowMs - 18 * ONE_DAY).toISOString(),
  ];

  const velocity = calculateComplaintVelocity(surgingTimestamps, nowMs);
  assert(velocity.current_period_count === 6, 'Correctly counts current 7-day period arrivals (6)');
  assert(velocity.prior_period_count === 2, 'Correctly counts prior 7-day period arrivals (2)');
  assert(velocity.wow_velocity_pct >= 100, `Calculates WoW velocity spike (+${velocity.wow_velocity_pct}%)`);
  assert(velocity.is_surging === true, 'Identifies explosive velocity surge condition');
  assert(velocity.trend_direction === 'ACCELERATING' || velocity.trend_direction === 'INCREASING', 'Assigns upward trend direction');

  const buckets = getWeeklyHistogramBuckets(surgingTimestamps, nowMs, 4);
  assert(buckets.length === 4, 'Generates 4-week histogram buckets');
  assert(buckets[3] === 6, 'Latest weekly bucket contains 6 arrivals');

  // ---------------------------------------------------------------------------
  // 2. RECURRENCE & CHRONIC BREAKDOWN ENGINE
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 2] Micro-Geographic Recurrence & Chronic Failure Scoring');

  const testRecurrentPoints = [
    {
      id: 'r1',
      tracking_id: 'TN-REC-1',
      latitude: 13.0418,
      longitude: 80.2341,
      category_name: 'Drainage & Sewage',
      category_id: 'd0000001-0000-0000-0000-000000000004',
      status: 'in_progress',
      priority: 'urgent',
      address: 'Usman Road, T. Nagar',
      ward: 119,
      district: 'Chennai',
      created_at: new Date(nowMs - 2 * ONE_DAY).toISOString(),
    },
    {
      id: 'r2',
      tracking_id: 'TN-REC-2',
      latitude: 13.042,
      longitude: 80.2343,
      category_name: 'Drainage & Sewage',
      category_id: 'd0000001-0000-0000-0000-000000000004',
      status: 'created',
      priority: 'high',
      address: 'Usman Road Junction, T. Nagar',
      ward: 119,
      district: 'Chennai',
      created_at: new Date(nowMs - 8 * ONE_DAY).toISOString(),
    },
    {
      id: 'r3',
      tracking_id: 'TN-REC-3',
      latitude: 13.0419,
      longitude: 80.2342,
      category_name: 'Drainage & Sewage',
      category_id: 'd0000001-0000-0000-0000-000000000004',
      status: 'assigned',
      priority: 'urgent',
      address: 'Usman Road Underpass, T. Nagar',
      ward: 119,
      district: 'Chennai',
      created_at: new Date(nowMs - 20 * ONE_DAY).toISOString(),
    },
  ];

  const recurrentClusters = analyzeInfrastructureRecurrence(testRecurrentPoints, 0.25);
  assert(recurrentClusters.length === 1, 'Identifies micro-spatial recurrence cluster within 250m radius');
  assert(recurrentClusters[0].total_count === 3, 'Clusters 3 repeat complaints at Usman Road');
  assert(recurrentClusters[0].recurrence_score >= 50, `Calculates high recurrence score (${recurrentClusters[0].recurrence_score}/100)`);
  assert(recurrentClusters[0].unresolved_count === 3, 'Tracks 3 unresolved repeat complaints');

  // ---------------------------------------------------------------------------
  // 3. SEASONAL & CLIMATE RISK ENGINE
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 3] Tamil Nadu Climate Calendar & Seasonal Multipliers');

  const monsoonDate = new Date(2026, 10, 15); // Nov 15 (Monsoon)
  const summerDate = new Date(2026, 3, 20); // Apr 20 (Summer)
  const pongalDate = new Date(2026, 0, 15); // Jan 15 (Winter/Pongal)

  assert(getCurrentTamilNaduSeason(monsoonDate) === 'NORTHEAST_MONSOON', 'Correctly identifies Northeast Monsoon (Nov)');
  assert(getCurrentTamilNaduSeason(summerDate) === 'SUMMER_PRE_MONSOON', 'Correctly identifies Summer Pre-Monsoon (Apr)');
  assert(getCurrentTamilNaduSeason(pongalDate) === 'WINTER_POST_MONSOON', 'Correctly identifies Winter Post-Monsoon (Jan)');

  const monsoonDrainMultiplier = getSeasonalCategoryMultiplier('DRAINAGE_FLOOD', 'NORTHEAST_MONSOON');
  assert(monsoonDrainMultiplier >= 1.6, `Applies high drainage flood multiplier during Monsoon (${monsoonDrainMultiplier}x)`);

  const summerWaterMultiplier = getSeasonalCategoryMultiplier('WATER_SUPPLY_FAILURE', 'SUMMER_PRE_MONSOON');
  assert(summerWaterMultiplier >= 1.6, `Applies high water scarcity multiplier during Summer (${summerWaterMultiplier}x)`);

  const advisories = getTamilNaduSeasonalAdvisories();
  assert(advisories.length === 4, 'Provides complete 4-season Tamil Nadu advisory catalog');
  assert(advisories.some((a) => a.is_active_now), 'Determines currently active seasonal advisory');

  // ---------------------------------------------------------------------------
  // 4. MULTI-FACTOR PROBABILISTIC RISK EVALUATION
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 4] Multi-Factor Probabilistic Risk Scoring & Directives');

  const riskResult = evaluatePredictiveRisk({
    cluster: recurrentClusters[0],
    velocity: calculateComplaintVelocity(testRecurrentPoints.map((p) => p.created_at), nowMs),
    now: new Date(nowMs),
  });

  assert(riskResult.risk_score >= 0 && riskResult.risk_score <= 100, `Risk score within probabilistic bounds [0, 100]: ${riskResult.risk_score}`);
  assert(riskResult.confidence_pct >= 0 && riskResult.confidence_pct <= 100, `Model confidence within bounds [0, 100]: ${riskResult.confidence_pct}%`);
  assert(riskResult.risk_category === 'DRAINAGE_FLOOD', 'Correctly infers DRAINAGE_FLOOD category');
  assert(riskResult.preventative_actions.length >= 1, 'Generates actionable preventative municipal directives');
  assert(riskResult.preventative_actions[0].equipment_needed.length > 0, 'Includes required machinery & equipment checklist');

  // ---------------------------------------------------------------------------
  // 5. DECOUPLING VERIFICATION (DBSCAN vs PREDICTIVE)
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 5] Strict DMT Clustering vs Predictive Decoupling');

  const pipelineOutput = executePredictiveAnalyticsPipeline(HISTORICAL_MINING_DATASET, {});
  assert(pipelineOutput.methodology_notes.probabilistic_disclaimer.includes('probabilistic early-warning'), 'Includes explicit probabilistic disclaimer');
  assert(pipelineOutput.methodology_notes.dmt_decoupling_notice.includes('DBSCAN clustering in Phase 12 identifies historical spatial density clusters'), 'Explicitly notes DBSCAN is historical density clustering, not a future prophecy');
  assert(pipelineOutput.risks.length > 0, 'Generates forward-looking potential risks from historical dataset');
  assert(pipelineOutput.future_problem_areas.length > 0, 'Identifies potential future problem areas with radius buffers');
  assert(pipelineOutput.emerging_patterns.length > 0, 'Identifies emerging complaint velocity spikes');

  // ---------------------------------------------------------------------------
  // 6. ROLE-BASED VISIBILITY & REDACTION
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 6] Role-Based Visibility, Scoping & Redaction');

  // Citizen Scope
  const citizenScoped = scopePredictiveResponseByRole(pipelineOutput, 'citizen');
  assert(citizenScoped.role_context.view_mode === 'public', 'Citizen receives public view mode');
  assert(citizenScoped.role_context.can_dispatch === false, 'Citizen cannot dispatch official work orders');
  assert(
    citizenScoped.risks[0].preventative_actions[0].instructions.includes('Citizens advised to cooperate') ||
      citizenScoped.risks[0].preventative_actions[0].recommended_crew === 'Municipal Maintenance Unit',
    'Redacts internal tactical instructions for public citizens'
  );

  // Area Officer Scope
  const officerScoped = scopePredictiveResponseByRole(pipelineOutput, 'area_officer', 119);
  assert(officerScoped.role_context.view_mode === 'tactical', 'Area Officer receives tactical view mode');
  assert(officerScoped.role_context.can_dispatch === true, 'Area Officer has work-order dispatch capability');
  assert(
    officerScoped.risks.every((r) => r.ward === 119 || r.ward === null),
    'Scopes risks strictly to Area Officer assigned Ward 119'
  );

  // District Collector Scope
  const collectorScoped = scopePredictiveResponseByRole(pipelineOutput, 'district_collector');
  assert(collectorScoped.role_context.view_mode === 'strategic', 'District Collector receives strategic executive view');
  assert(collectorScoped.role_context.can_dispatch === true, 'District Collector has cross-agency dispatch authority');

  // ---------------------------------------------------------------------------
  // 7. PREVENTATIVE ACTION DISPATCH STORE
  // ---------------------------------------------------------------------------
  console.log('\n[TEST GROUP 7] Work-Order Dispatch Store & Lifecycle State');

  const testActionId = pipelineOutput.risks[0].preventative_actions[0].id;
  ACTION_DISPATCH_STORE.set(testActionId, {
    status: 'DISPATCHED',
    dispatched_at: new Date().toISOString(),
    dispatched_by: 'Area Engineer (T. Nagar)',
  });

  const refreshedOutput = executePredictiveAnalyticsPipeline(HISTORICAL_MINING_DATASET, {});
  const matchingAction = refreshedOutput.risks
    .flatMap((r) => r.preventative_actions)
    .find((a) => a.id === testActionId);

  assert(matchingAction?.status === 'DISPATCHED', 'Correctly updates dispatched action status in pipeline response');
  assert(matchingAction?.dispatched_by === 'Area Engineer (T. Nagar)', 'Records dispatched officer identity');

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal error in predictive test suite:', err);
  process.exit(1);
});
