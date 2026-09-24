import { executeUnifiedAnalyticsPipeline } from '../lib/data-mining/pipeline';
import { HISTORICAL_MINING_DATASET } from '../lib/data-mining/seed-data';

console.log('==================================================');
console.log('📊 DMT DATASET & PIPELINE VERIFICATION METRICS');
console.log('==================================================');
console.log(`Total Seed Dataset Records: ${HISTORICAL_MINING_DATASET.length}\n`);

// 90 days filter
const res90d = executeUnifiedAnalyticsPipeline([], { timeRange: '90d', includeHistorical: true });
console.log('--- 90-Day Analytics Window ---');
console.log(`Total Complaints: ${res90d.summary.total_complaints}`);
console.log(`Open: ${res90d.summary.open_complaints}, Resolved: ${res90d.summary.resolved_complaints}`);
console.log(`SLA Compliance Rate: ${res90d.summary.sla_compliance_pct}%`);
console.log(`DBSCAN Spatial Clusters Found: ${res90d.dbscan.clusters.length}`);
console.log(`Geographic Hotspots Identified: ${res90d.dbscan.hotspots.length}`);
console.log(`Isolated Rural Noise Points: ${res90d.dbscan.noise_points.length}`);
console.log(`Governance Insights Synthesized: ${res90d.governance_insights.length}\n`);

console.log('--- District Distribution (90d) ---');
for (const d of res90d.district_trends) {
  console.log(`  • ${d.district.padEnd(16)}: ${d.total_complaints} complaints (${d.clusters_count} clusters, ${d.hotspots_count} hotspots)`);
}

console.log('\n--- Department Workload (90d) ---');
for (const dept of res90d.departments) {
  console.log(`  • ${dept.name.padEnd(25)}: ${dept.total_assigned} assigned (${dept.resolved} resolved, ${dept.pending} pending, ${dept.resolution_rate_pct}% res rate)`);
}

// 1 Year filter
const res1y = executeUnifiedAnalyticsPipeline([], { timeRange: '1y', includeHistorical: true });
console.log('\n--- 1-Year Analytics Window (with Monsoon & Summer Seasonal Spikes) ---');
console.log(`Total Complaints (1-Year): ${res1y.summary.total_complaints}`);
console.log(`Total Clusters (1-Year): ${res1y.dbscan.clusters.length}`);
console.log(`Total Hotspots (1-Year): ${res1y.dbscan.hotspots.length}`);
console.log(`Time-series trend points: ${res1y.time_series.length}`);
console.log('==================================================\n');
