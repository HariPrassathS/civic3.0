// =============================================================================
// CivicConnect TN — Predictive Risk & Early Warning Intelligence Aggregator
// =============================================================================

import { executePredictiveAnalyticsPipeline } from '@/lib/predictive/pipeline';
import { PredictiveFilterState } from '@/lib/predictive/types';
import { EnrichedComplaintRecord } from '../data-fetcher';
import { ReportDataPayload, ReportFilterOptions } from '../types';

export function aggregatePredictiveInsightReport(
  complaints: EnrichedComplaintRecord[],
  filters: ReportFilterOptions,
  filtersSummary: Record<string, string>,
  dateLabel: string
): ReportDataPayload {
  const predFilters: PredictiveFilterState = {
    timeHorizon: 'all',
    district: filters.district !== 'all' ? filters.district : undefined,
    ward: filters.ward || undefined,
    category: filters.categoryId !== 'all' ? (filters.categoryId as any) : undefined,
    departmentId: filters.departmentId !== 'all' ? filters.departmentId : undefined,
  };

  const predResponse = executePredictiveAnalyticsPipeline(complaints, predFilters);

  const risks = predResponse.risks;
  const highConfidence = risks.filter((r) => r.confidence_tier === 'HIGH').length;
  const criticalThreats = risks.filter((r) => r.risk_score >= 80).length;

  const columns = [
    { key: 'risk_id', label: 'Threat Code', width: 12, formatter: 'text' as const },
    { key: 'hazard_title', label: 'Forecasted Municipal Risk', width: 22, formatter: 'text' as const },
    { key: 'risk_score', label: 'Risk Score', width: 10, formatter: 'percentage' as const, align: 'center' as const },
    { key: 'confidence_tier', label: 'Confidence', width: 11, formatter: 'badge' as const, align: 'center' as const },
    { key: 'time_horizon', label: 'Horizon Window', width: 14, formatter: 'text' as const },
    { key: 'location', label: 'Projected Zone', width: 14, formatter: 'text' as const },
    { key: 'climate_factor', label: 'Climate Multiplier', width: 13, formatter: 'text' as const, align: 'center' as const },
    { key: 'preventative_action', label: 'Recommended Preventative Action', width: 22, formatter: 'text' as const },
  ];

  const rows = risks.map((r) => {
    const mult = r.risk_drivers?.seasonal_multiplier || 1.25;
    const actionTitle = r.preventative_actions?.[0]?.title || 'Deploy preventative inspection squad';

    return {
      risk_id: r.id.toUpperCase().slice(0, 12),
      hazard_title: r.title,
      risk_score: `${r.risk_score}%`,
      confidence_tier: r.confidence_tier,
      time_horizon: r.time_horizon_label || r.projected_time_horizon,
      location: `Ward ${r.ward || '—'}, ${r.district}`,
      climate_factor: `${mult.toFixed(2)}x Seasonal Stress`,
      preventative_action: actionTitle,
    };
  });

  const activeSeasonName =
    Array.isArray(predResponse.seasonal_advisories) && predResponse.seasonal_advisories.length > 0
      ? predResponse.seasonal_advisories[0].season_name
      : 'Tamil Nadu Climate Baseline';

  return {
    metadata: {
      reportType: 'predictive_insight_report',
      title: 'Predictive Risk & Early Warning Intelligence Briefing',
      subtitle: 'Forward-looking failure modeling, velocity surge detection, and climate correlation forecasts',
      description: 'Strategic preventative briefing for District Collectors, Disaster Management cells, and Department Secretaries.',
      generatedAt: new Date().toISOString(),
      generatedBy: 'CivicConnect TN Reporting Engine (CivicPredict AI)',
      organization: 'Government of Tamil Nadu — Municipal Administration & Water Supply Department',
      departmentScope: filtersSummary.Department || 'All Departments',
      districtScope: filtersSummary.District || 'All Districts',
      dateScope: dateLabel,
      totalRecords: risks.length,
      filtersApplied: filtersSummary,
    },
    kpis: [
      { key: 'active_risks', label: 'Forecasted Risk Zones', value: risks.length, unit: 'Threats', tone: 'danger', subtext: 'Probabilistic failure models' },
      { key: 'critical_threats', label: 'Critical Risk Score (≥80%)', value: criticalThreats, tone: criticalThreats > 0 ? 'danger' : 'neutral', subtext: 'Immediate action window' },
      { key: 'high_conf', label: 'High Confidence Signals', value: highConfidence, tone: 'warning', subtext: 'Multi-factor recurrence grounded' },
      { key: 'surges', label: 'Emerging Arrival Surges', value: predResponse.emerging_patterns.length, tone: 'info', subtext: 'dN/dt velocity acceleration' },
      { key: 'preventative_orders', label: 'Active Action Directives', value: predResponse.summary.preventative_actions_dispatched || 0, unit: 'Orders', tone: 'success', subtext: 'Dispatched work squads' },
    ],
    columns,
    rows,
    summarySections: [
      {
        title: 'Probabilistic Methodology & Climate Calendar Grounding',
        items: [
          { label: 'Model Grounding', value: 'Multi-factor probability synthesis (30% Recurrence + 25% Velocity + 20% Climate + 15% Unresolved + 10% Severity)' },
          { label: 'DBSCAN Decoupling', value: 'Phase 12 DBSCAN captures historical density; Phase 13 models forward failure trajectories' },
          { label: 'Active Season', value: activeSeasonName },
        ],
      },
      {
        title: 'Top Priority Preventative Directives',
        items: rows.slice(0, 5).map((r) => ({
          label: `${r.hazard_title} (${r.location})`,
          value: `Risk: ${r.risk_score} | ${r.time_horizon} — Action: ${r.preventative_action}`,
        })),
      },
    ],
  };
}
