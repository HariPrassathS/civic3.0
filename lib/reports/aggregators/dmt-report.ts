// =============================================================================
// CivicConnect TN — Data Mining & Spatial Density (DBSCAN) Aggregator
// =============================================================================

import { executeUnifiedAnalyticsPipeline } from '@/lib/data-mining/pipeline';
import { AnalyticsFilterState } from '@/lib/data-mining/types';
import { EnrichedComplaintRecord } from '../data-fetcher';
import { ReportDataPayload, ReportFilterOptions } from '../types';

export function aggregateDmtReport(
  complaints: EnrichedComplaintRecord[],
  filters: ReportFilterOptions,
  filtersSummary: Record<string, string>,
  dateLabel: string
): ReportDataPayload {
  const dmtFilters: AnalyticsFilterState = {
    epsilonKm: 0.6,
    minPts: 3,
    timeRange: filters.timeRange === 'custom' ? '90d' : (filters.timeRange as any) || '90d',
    district: filters.district !== 'all' ? filters.district : undefined,
    ward: filters.ward || undefined,
    categoryId: filters.categoryId !== 'all' ? filters.categoryId : undefined,
    departmentId: filters.departmentId !== 'all' ? filters.departmentId : undefined,
    priority: filters.priority !== 'all' ? filters.priority : undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
  };

  const analytics = executeUnifiedAnalyticsPipeline(complaints as any[], dmtFilters);

  const clusterSummary = analytics.dbscan.summary;
  const clusterCount = clusterSummary.total_clusters;
  const clusteredPoints = clusterSummary.clustered_complaints;
  const noisePoints = clusterSummary.noise_complaints;
  const totalPoints = clusterSummary.total_analyzed;
  const clusteringRate = totalPoints > 0 ? Math.round((clusteredPoints / totalPoints) * 100) : 0;

  const columns = [
    { key: 'cluster_id', label: 'Cluster ID', width: 12, formatter: 'text' as const },
    { key: 'label', label: 'Cluster Label / Zone', width: 22, formatter: 'text' as const },
    { key: 'dominant_category', label: 'Dominant Issue', width: 18, formatter: 'text' as const },
    { key: 'point_count', label: 'Grievances', width: 10, formatter: 'number' as const, align: 'right' as const },
    { key: 'district_ward', label: 'Ward / District', width: 14, formatter: 'text' as const },
    { key: 'density_score', label: 'Density Score', width: 12, formatter: 'badge' as const, align: 'center' as const },
    { key: 'center_gps', label: 'Centroid (Lat, Lng)', width: 15, formatter: 'text' as const },
  ];

  const rows = analytics.dbscan.clusters.map((c, idx) => {
    const lat = c.centroid_latitude || 13.0827;
    const lng = c.centroid_longitude || 80.2707;
    const densityVal = c.density_pts_per_sqkm || 0;

    return {
      cluster_id: `CLS-${c.cluster_id >= 0 ? c.cluster_id + 1 : idx + 1}`,
      label: c.name || `Zone ${idx + 1} Spatial Group`,
      dominant_category: c.dominant_category || 'Municipal Infrastructure',
      point_count: c.total_points || 0,
      district_ward: `Ward ${c.ward || '—'}, ${c.district || 'Chennai'}`,
      density_score: densityVal > 15 ? 'HIGH DENSITY' : densityVal > 5 ? 'MODERATE' : 'SPARSE',
      center_gps: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };
  });

  return {
    metadata: {
      reportType: 'dmt_report',
      title: 'Data Mining & Spatial-Temporal Clustering Audit (DBSCAN)',
      subtitle: 'Density-Based Spatial Clustering of Applications with Noise algorithm execution results',
      description: 'Official computational analytics report for GIS planners, municipal engineers, and smart city cells.',
      generatedAt: new Date().toISOString(),
      generatedBy: 'CivicConnect TN Reporting Engine',
      organization: 'Government of Tamil Nadu — Municipal Administration & Water Supply Department',
      departmentScope: filtersSummary.Department || 'All Departments',
      districtScope: filtersSummary.District || 'All Districts',
      dateScope: dateLabel,
      totalRecords: totalPoints,
      filtersApplied: filtersSummary,
    },
    kpis: [
      { key: 'clusters', label: 'Identified Spatial Clusters', value: clusterCount, unit: 'Clusters', tone: 'info', subtext: 'ε = 0.6 km, MinPts = 3' },
      { key: 'clustered_pts', label: 'Clustered Grievances', value: `${clusteredPoints} (${clusteringRate}%)`, tone: 'warning', subtext: 'Core density points' },
      { key: 'noise_pts', label: 'Isolated Noise Points', value: noisePoints, unit: 'Cases', tone: 'neutral', subtext: 'Dispersed single occurrences' },
      { key: 'hotspots', label: 'Critical Hotspot Clusters', value: analytics.dbscan.hotspots.length, tone: 'danger', subtext: 'Requiring immediate intervention' },
      { key: 'common_issues', label: 'Common Issue Groups', value: analytics.dbscan.common_issue_groups.length, tone: 'success', subtext: 'Eligible for unified work orders' },
    ],
    columns,
    rows,
    summarySections: [
      {
        title: 'DBSCAN Algorithmic Hyperparameters',
        items: [
          { label: 'Epsilon Distance (ε)', value: '0.6 km (Spatial neighborhood radius)' },
          { label: 'Minimum Core Points (MinPts)', value: '3 complaints required to form a cluster' },
          { label: 'Spatial Indexing Engine', value: 'PostGIS Haversine 2D Spatial Metric' },
        ],
      },
      {
        title: 'Top Identified Spatial Density Clusters',
        items: rows.slice(0, 5).map((r) => ({
          label: `${r.cluster_id}: ${r.label}`,
          value: `${r.point_count} complaints (${r.dominant_category}) — ${r.density_score}`,
        })),
      },
    ],
  };
}
