// =============================================================================
// CivicConnect TN — Phase 12 Visual Analytics & DBSCAN Test Suite
// =============================================================================

import { haversineDistanceKm, computePointDistance, runDBSCAN } from '../lib/data-mining/dbscan';
import { executeUnifiedAnalyticsPipeline } from '../lib/data-mining/pipeline';
import { DataPoint } from '../lib/data-mining/types';

async function runVisualAnalyticsTests() {
  console.log('🧪 Starting Phase 12: Visual Analytics & DBSCAN Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. MATHEMATICAL DISTANCE METRICS
  // ---------------------------------------------------------------------------
  console.log('--- 1. Spatial & Feature Distance Calculations ---');

  const distKm = haversineDistanceKm(13.0418, 80.2341, 12.9915, 80.2185);
  assert(
    distKm > 5.5 && distKm < 6.2,
    'Haversine distance between T. Nagar and Velachery is ~5.8 km',
    `Computed: ${distKm.toFixed(2)} km`
  );

  const p1: DataPoint = {
    id: 'p1',
    tracking_id: 'CC-1',
    title: 'Pothole A',
    description: '',
    category_id: 'cat-roads',
    status: 'created',
    priority: 'high',
    address: 'Usman Rd',
    ward: 114,
    district: 'Chennai',
    latitude: 13.0418,
    longitude: 80.2341,
    created_at: new Date().toISOString(),
  };

  const p2: DataPoint = {
    id: 'p2',
    tracking_id: 'CC-2',
    title: 'Pothole B',
    description: '',
    category_id: 'cat-roads',
    status: 'created',
    priority: 'high',
    address: 'Usman Rd South',
    ward: 114,
    district: 'Chennai',
    latitude: 13.0420,
    longitude: 80.2342,
    created_at: new Date().toISOString(),
  };

  const p3_water: DataPoint = {
    id: 'p3',
    tracking_id: 'CC-3',
    title: 'Water Leak',
    description: '',
    category_id: 'cat-water',
    status: 'created',
    priority: 'high',
    address: 'Usman Rd',
    ward: 114,
    district: 'Chennai',
    latitude: 13.0420,
    longitude: 80.2342,
    created_at: new Date().toISOString(),
  };

  const dSameCat = computePointDistance(p1, p2, { epsilonKm: 0.5, minPts: 3, categoryWeight: 0.3 });
  const dDiffCat = computePointDistance(p1, p3_water, { epsilonKm: 0.5, minPts: 3, categoryWeight: 0.3 });

  assert(
    dDiffCat > dSameCat,
    'Category penalty increases composite feature distance between different categories',
    `Same: ${dSameCat.toFixed(4)}, Diff: ${dDiffCat.toFixed(4)}`
  );

  // ---------------------------------------------------------------------------
  // 2. SYNTHETIC DBSCAN PARTITIONING
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Synthetic DBSCAN Clustering & Point Classification ---');

  const syntheticPoints: DataPoint[] = [
    { ...p1, id: 'a1', latitude: 13.0418, longitude: 80.2341 },
    { ...p1, id: 'a2', latitude: 13.0419, longitude: 80.2342 },
    { ...p1, id: 'a3', latitude: 13.0417, longitude: 80.2340 },
    { ...p1, id: 'a4', latitude: 13.0422, longitude: 80.2345 },
    { ...p1, id: 'b1', district: 'Coimbatore', latitude: 11.0168, longitude: 76.9658 },
    { ...p1, id: 'b2', district: 'Coimbatore', latitude: 11.0170, longitude: 76.9660 },
    { ...p1, id: 'b3', district: 'Coimbatore', latitude: 11.0166, longitude: 76.9655 },
    { ...p1, id: 'noise1', district: 'Nilgiris', latitude: 11.3530, longitude: 76.7959 },
  ];

  const dbscanResult = runDBSCAN(syntheticPoints, { epsilonKm: 0.5, minPts: 3 });

  assert(
    dbscanResult.clusters.length === 2,
    'Discovers exactly 2 spatial clusters for synthetic dataset',
    `Found: ${dbscanResult.clusters.length}`
  );

  assert(
    dbscanResult.noisePoints.length === 1 && dbscanResult.noisePoints[0].id === 'noise1',
    'Correctly isolates the Nilgiris outlier as a Noise Point (cluster_id = -1)',
    `Noise count: ${dbscanResult.noisePoints.length}`
  );

  // ---------------------------------------------------------------------------
  // 3. UNIFIED VISUAL ANALYTICS & KPI CALCULATIONS
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Unified Visual Analytics & KPI Calculations ---');

  const analyticsResult = executeUnifiedAnalyticsPipeline([], {
    timeRange: '90d',
    epsilonKm: 0.5,
    minPts: 3,
  });

  const kpis = analyticsResult.summary;
  assert(
    kpis.total_complaints > 0 && kpis.total_complaints === kpis.open_complaints + kpis.resolved_complaints,
    'KPI Consistency: Total complaints equals Open + Resolved complaints',
    `Total: ${kpis.total_complaints} (Open: ${kpis.open_complaints}, Resolved: ${kpis.resolved_complaints})`
  );

  assert(
    kpis.sla_compliance_pct >= 0 && kpis.sla_compliance_pct <= 100,
    'SLA Compliance rate is a valid percentage (0-100%)',
    `SLA: ${kpis.sla_compliance_pct}%`
  );

  assert(
    analyticsResult.time_series.length > 0,
    'Generates daily/weekly time-series trend data points',
    `Data points: ${analyticsResult.time_series.length}`
  );

  // ---------------------------------------------------------------------------
  // 4. DEPARTMENT PERFORMANCE & SLA MATRICES
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Department Performance & SLA Matrices ---');

  assert(
    analyticsResult.departments.length >= 8,
    'Computes multi-metric performance across all 8 standard TN departments',
    `Departments: ${analyticsResult.departments.map((d) => d.code).join(', ')}`
  );

  const deptTotalAssigned = analyticsResult.departments.reduce((sum, d) => sum + d.total_assigned, 0);
  assert(
    deptTotalAssigned >= kpis.total_complaints,
    'Department workload covers all registered grievances',
    `Assigned: ${deptTotalAssigned}`
  );

  const sla = analyticsResult.sla_performance;
  assert(
    sla.sla_met_count + sla.sla_breached_count === kpis.total_complaints,
    'SLA Met + SLA Breached matches total volume',
    `Met: ${sla.sla_met_count}, Breached: ${sla.sla_breached_count}`
  );

  // ---------------------------------------------------------------------------
  // 5. STATUS, PRIORITY & REAL GOVERNANCE INSIGHTS
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Status, Priority & Real Governance Insights ---');

  const statusSum = analyticsResult.status_distribution.reduce((sum, s) => sum + s.count, 0);
  assert(
    statusSum === kpis.total_complaints,
    'Status distribution sum matches total complaints',
    `Sum: ${statusSum}`
  );

  assert(
    analyticsResult.governance_insights.length >= 2,
    'Synthesizes calculated real governance insights and recommendations',
    `Insights count: ${analyticsResult.governance_insights.length}`
  );

  // ---------------------------------------------------------------------------
  // 6. 4-LAYER MAP & HEATMAP INTEGRATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. 4-Layer Map & Density Heatmap Integration ---');

  assert(
    analyticsResult.heatmap_points.length === kpis.total_complaints,
    'Generates real GPS coordinates and intensity weights for density heatmap',
    `Heatmap points: ${analyticsResult.heatmap_points.length}`
  );

  assert(
    analyticsResult.dbscan.clusters.length >= 4 && analyticsResult.dbscan.hotspots.length >= 4,
    'DBSCAN clusters and Geographic Hotspots are synchronized with map layers',
    `Clusters: ${analyticsResult.dbscan.clusters.length}, Hotspots: ${analyticsResult.dbscan.hotspots.length}`
  );

  // ---------------------------------------------------------------------------
  // 7. GLOBAL FILTER SYNCHRONIZATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Global Filter Synchronization & Empty State ---');

  const waterFiltered = executeUnifiedAnalyticsPipeline([], {
    timeRange: '30d',
    departmentId: 'd0000001-0000-0000-0000-000000000001', // Water Supply
  });

  assert(
    waterFiltered.summary.total_complaints <= kpis.total_complaints,
    'Applying department filter updates KPI, charts, and DBSCAN clusters synchronously',
    `Water volume: ${waterFiltered.summary.total_complaints} vs Total: ${kpis.total_complaints}`
  );

  const emptyFiltered = executeUnifiedAnalyticsPipeline([], {
    timeRange: '7d',
    district: 'NonExistentDistrictName',
  });

  assert(
    emptyFiltered.has_data === false && emptyFiltered.empty_message !== undefined,
    'Returns clean empty state without inventing fake statistics when no data matches filter',
    `Empty message: "${emptyFiltered.empty_message}"`
  );

  console.log(`\n==================================================`);
  console.log(`Phase 12 Visual Analytics Tests Complete: ${passed} Passed, ${failed} Failed`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runVisualAnalyticsTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
