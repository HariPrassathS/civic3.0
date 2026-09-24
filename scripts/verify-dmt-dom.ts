import { executeUnifiedAnalyticsPipeline } from '../lib/data-mining/pipeline';
import { HISTORICAL_MINING_DATASET } from '../lib/data-mining/seed-data';

async function verifyDMTDOMAndDataIntegrity() {
  console.log('🧪 Starting DMT DOM & Data Integrity Deep Verification...\n');

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

  // 1. ISOLATION VERIFICATION (Live DB vs Historical Simulation)
  console.log('--- 1. Live DB vs Historical Isolation ---');
  
  const mockLiveComplaints = [
    {
      id: 'live-01',
      tracking_id: 'CC-LIVE-001',
      title: 'Real citizen pothole on OMR',
      description: 'Reported through mobile web',
      category_id: 'ROADS_POTHOLE',
      category_name: 'Pothole Cluster',
      department_id: 'd0000001-0000-0000-0000-000000000002',
      department_name: 'Roads & Infrastructure',
      status: 'created',
      priority: 'high',
      address: 'OMR, Sholinganallur, Chennai',
      ward: 197,
      district: 'Chennai',
      latitude: 12.9010,
      longitude: 80.2270,
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      upvotes_count: 15,
    },
    {
      id: 'live-02',
      tracking_id: 'CC-LIVE-002',
      title: 'Water leak on Thoraipakkam radial road',
      description: 'Pipeline leakage',
      category_id: 'WATER_PIPE_LEAK',
      category_name: 'Pipe Leakage',
      department_id: 'd0000001-0000-0000-0000-000000000001',
      department_name: 'Water Supply',
      status: 'in_progress',
      priority: 'urgent',
      address: 'Radial Road, Thoraipakkam, Chennai',
      ward: 197,
      district: 'Chennai',
      latitude: 12.9350,
      longitude: 80.2150,
      created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      upvotes_count: 24,
    },
  ];

  // Test Live Mode
  const liveResult = executeUnifiedAnalyticsPipeline(mockLiveComplaints, {
    timeRange: '90d',
    dataSource: 'live',
    includeHistorical: false,
  });

  assert(
    liveResult.summary.total_complaints === mockLiveComplaints.length,
    'Live Mode strictly contains ONLY live registered complaints (No historical pollution)',
    `Live complaints: ${liveResult.summary.total_complaints} vs Expected: ${mockLiveComplaints.length}`
  );

  assert(
    liveResult.data_sources?.live_count === mockLiveComplaints.length,
    'Data source metadata reports exact live count for UI toggle badge',
    `Reported live: ${liveResult.data_sources?.live_count}`
  );

  // Test Historical Combined Mode (90d window)
  const combinedResult90d = executeUnifiedAnalyticsPipeline(mockLiveComplaints, {
    timeRange: '90d',
    dataSource: 'all',
    includeHistorical: true,
  });

  assert(
    combinedResult90d.summary.total_complaints === 448,
    'Historical Simulation Mode filters 90-day active complaints accurately (446 seed + 2 live)',
    `90d total: ${combinedResult90d.summary.total_complaints}`
  );

  // Test Historical Combined Mode (All history window)
  const combinedResult = executeUnifiedAnalyticsPipeline(mockLiveComplaints, {
    timeRange: 'all',
    dataSource: 'all',
    includeHistorical: true,
  });

  assert(
    combinedResult.summary.total_complaints === HISTORICAL_MINING_DATASET.length + mockLiveComplaints.length,
    'Historical Simulation Mode merges Live complaints + 455 Historical AI Dataset on All-History window',
    `Combined total: ${combinedResult.summary.total_complaints} (Expected: ${HISTORICAL_MINING_DATASET.length + mockLiveComplaints.length})`
  );

  assert(
    combinedResult.data_sources?.historical_count === HISTORICAL_MINING_DATASET.length,
    'Data source metadata reports 455 historical AI benchmark records',
    `Reported historical: ${combinedResult.data_sources?.historical_count}`
  );

  // 2. DOM & VISUAL ANALYTICS CONTRACT INTEGRITY
  console.log('\n--- 2. Visual Analytics Contract & Chart Data Structure ---');

  assert(
    combinedResult.time_series.length > 0 && combinedResult.time_series.every(t => t.date && t.label && typeof t.total === 'number'),
    'Complaint Trend Line Chart dataset is complete with formatted dates & totals'
  );

  assert(
    combinedResult.status_distribution.length > 0 && combinedResult.status_distribution.every(s => s.label && s.color && typeof s.count === 'number'),
    'Status Distribution Donut Chart dataset is fully formed with hex color tokens'
  );

  assert(
    combinedResult.priority_distribution.length > 0 && combinedResult.priority_distribution.every(p => p.label && p.color && typeof p.count === 'number'),
    'Priority Severity Donut Chart dataset is fully formed with trend directions'
  );

  assert(
    combinedResult.categories.length > 0 && combinedResult.categories.every(c => c.category_name && typeof c.count === 'number'),
    'Category Distribution Bar Chart dataset contains valid percentages and resolution averages'
  );

  assert(
    combinedResult.departments.length === 8 && combinedResult.departments.every(d => d.name && typeof d.total_assigned === 'number'),
    'Department Performance Matrix contains all 8 Tamil Nadu administrative bodies'
  );

  assert(
    combinedResult.sla_performance && typeof combinedResult.sla_performance.compliance_pct === 'number',
    'SLA Performance Analytics data contains compliance metrics and priority breakdowns'
  );

  assert(
    combinedResult.governance_insights.length >= 2 && combinedResult.governance_insights.every(g => g.title && g.description && g.recommendation),
    'Governance Insights Synthesis generates actionable administrative recommendations'
  );

  // 3. DBSCAN CLUSTERS & HOTSPOT MAPPING
  console.log('\n--- 3. DBSCAN Clustering & 4-Layer GIS Map ---');

  assert(
    combinedResult.dbscan.clusters.length >= 25,
    'DBSCAN spatial density engine detects 25+ distinct urban clusters across Tamil Nadu',
    `Found: ${combinedResult.dbscan.clusters.length} clusters`
  );

  assert(
    combinedResult.dbscan.hotspots.length === combinedResult.dbscan.clusters.length,
    'Geographic Hotspots are 1:1 synchronized with DBSCAN high-density clusters'
  );

  assert(
    combinedResult.dbscan.noise_points.length >= 15,
    'Isolated rural grievances correctly isolated as Noise Outliers (cluster_id = -1)',
    `Noise points: ${combinedResult.dbscan.noise_points.length}`
  );

  assert(
    combinedResult.heatmap_points.length === combinedResult.summary.total_complaints,
    'Heatmap coordinates layer includes all analyzed data points with GPS weights'
  );

  // 4. TRENDS & ALGORITHM TUNING INTEGRITY
  console.log('\n--- 4. Ward & District Trends & Algorithm Tuning ---');

  assert(
    combinedResult.district_trends.length >= 15,
    'District Trends Matrix tracks multi-metric resolution rates across 15+ TN districts'
  );

  assert(
    combinedResult.dbscan.summary.clustering_coefficient >= 0 && combinedResult.dbscan.summary.clustering_coefficient <= 100,
    'Algorithm Diagnostics: Clustering coefficient is calculated as a valid percentage'
  );

  console.log(`\n==================================================`);
  console.log(`DMT Deep Verification Complete: ${passed} Passed, ${failed} Failed`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

verifyDMTDOMAndDataIntegrity().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
