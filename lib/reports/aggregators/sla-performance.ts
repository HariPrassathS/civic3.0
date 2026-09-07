// =============================================================================
// CivicConnect TN — SLA Compliance & Breach Analysis Aggregator
// =============================================================================

import { Priority } from '@/types/enums';
import { EnrichedComplaintRecord } from '../data-fetcher';
import { ReportDataPayload, ReportFilterOptions } from '../types';

export function aggregateSlaPerformance(
  complaints: EnrichedComplaintRecord[],
  filters: ReportFilterOptions,
  filtersSummary: Record<string, string>,
  dateLabel: string
): ReportDataPayload {
  const total = complaints.length;
  const breachedList = complaints.filter((c) => c.is_breached);
  const approachingList = complaints.filter((c) => c.is_sla_approaching);
  const metSlaList = complaints.filter((c) => !c.is_breached);

  const totalBreached = breachedList.length;
  const totalApproaching = approachingList.length;
  const complianceRate = total > 0 ? Math.round(((total - totalBreached) / total) * 100) : 100;

  // Priority-wise breakdown
  const prioritySla: Record<
    Priority,
    { total: number; breached: number; benchmarkHours: number }
  > = {
    [Priority.URGENT]: { total: 0, breached: 0, benchmarkHours: 12 },
    [Priority.HIGH]: { total: 0, breached: 0, benchmarkHours: 24 },
    [Priority.MEDIUM]: { total: 0, breached: 0, benchmarkHours: 48 },
    [Priority.LOW]: { total: 0, breached: 0, benchmarkHours: 72 },
  };

  complaints.forEach((c) => {
    const p = c.priority || Priority.MEDIUM;
    if (prioritySla[p]) {
      prioritySla[p].total += 1;
      if (c.is_breached) prioritySla[p].breached += 1;
    }
  });

  const columns = [
    { key: 'tracking_id', label: 'Tracking ID', width: 14, formatter: 'text' as const },
    { key: 'department_code', label: 'Dept', width: 9, formatter: 'text' as const },
    { key: 'priority', label: 'Priority', width: 10, formatter: 'badge' as const, align: 'center' as const },
    { key: 'sla_target', label: 'SLA Target', width: 11, formatter: 'hours' as const, align: 'center' as const },
    { key: 'elapsed_or_tat', label: 'Actual / Elapsed', width: 13, formatter: 'hours' as const, align: 'center' as const },
    { key: 'sla_status', label: 'SLA State', width: 12, formatter: 'badge' as const, align: 'center' as const },
    { key: 'ward', label: 'Ward', width: 7, formatter: 'number' as const, align: 'center' as const },
    { key: 'district', label: 'District', width: 11, formatter: 'text' as const },
    { key: 'escalation_tier', label: 'Escalation', width: 11, formatter: 'text' as const, align: 'center' as const },
  ];

  const now = new Date();

  const rows = complaints.map((c) => {
    const createdAt = new Date(c.created_at);
    const resolvedAt = c.resolved_at ? new Date(c.resolved_at) : null;
    const elapsedHours = resolvedAt
      ? Math.round(((resolvedAt.getTime() - createdAt.getTime()) / 3600000) * 10) / 10
      : Math.round(((now.getTime() - createdAt.getTime()) / 3600000) * 10) / 10;

    const targetHours =
      c.priority === Priority.URGENT
        ? 12
        : c.priority === Priority.HIGH
        ? 24
        : c.priority === Priority.MEDIUM
        ? 48
        : 72;

    let statusBadge = 'Within SLA';
    if (c.is_breached) statusBadge = 'BREACHED';
    else if (c.is_sla_approaching) statusBadge = '75% WARNING';
    else if (resolvedAt) statusBadge = 'MET ON TIME';

    return {
      tracking_id: c.tracking_id,
      department_code: c.department_code,
      priority: c.priority.toUpperCase(),
      sla_target: `${targetHours} hrs`,
      elapsed_or_tat: `${elapsedHours} hrs`,
      sla_status: statusBadge,
      ward: c.ward,
      district: c.district,
      escalation_tier: c.escalation_level > 0 ? `L${c.escalation_level}` : 'Normal',
      title: c.title,
    };
  });

  return {
    metadata: {
      reportType: 'sla_performance',
      title: 'Service Level Agreement (SLA) Compliance & Breach Register',
      subtitle: 'Audit of grievance resolution timeliness against statutory citizen service benchmarks',
      description: 'Official enforcement registry for Department Vigilance and Municipal Commissioners.',
      generatedAt: new Date().toISOString(),
      generatedBy: 'CivicConnect TN Reporting Engine',
      organization: 'Government of Tamil Nadu — Municipal Administration & Water Supply Department',
      departmentScope: filtersSummary.Department || 'All Departments',
      districtScope: filtersSummary.District || 'All Districts',
      dateScope: dateLabel,
      totalRecords: total,
      filtersApplied: filtersSummary,
    },
    kpis: [
      { key: 'sla_comp', label: 'SLA Compliance Rate', value: `${complianceRate}%`, tone: complianceRate >= 85 ? 'success' : complianceRate >= 70 ? 'warning' : 'danger', subtext: 'Statutory adherence' },
      { key: 'breached_count', label: 'Breached Grievances', value: totalBreached, tone: totalBreached > 0 ? 'danger' : 'success', subtext: 'Exceeded SLA limit' },
      { key: 'approaching_count', label: 'Imminent Warning (75%)', value: totalApproaching, tone: totalApproaching > 0 ? 'warning' : 'neutral', subtext: 'Action required' },
      { key: 'urgent_sla', label: 'Urgent Priority SLA (12h)', value: `${prioritySla[Priority.URGENT].total > 0 ? Math.round(((prioritySla[Priority.URGENT].total - prioritySla[Priority.URGENT].breached) / prioritySla[Priority.URGENT].total) * 100) : 100}%`, tone: 'info', subtext: 'Critical emergency standard' },
      { key: 'high_sla', label: 'High Priority SLA (24h)', value: `${prioritySla[Priority.HIGH].total > 0 ? Math.round(((prioritySla[Priority.HIGH].total - prioritySla[Priority.HIGH].breached) / prioritySla[Priority.HIGH].total) * 100) : 100}%`, tone: 'info', subtext: '24-hour turnaround target' },
    ],
    columns,
    rows,
    summarySections: [
      {
        title: 'Priority SLA Compliance Matrix',
        items: [
          {
            label: 'URGENT (Target: 12 Hours)',
            value: `${prioritySla[Priority.URGENT].total} complaints — ${prioritySla[Priority.URGENT].breached} breached (${prioritySla[Priority.URGENT].total > 0 ? Math.round(((prioritySla[Priority.URGENT].total - prioritySla[Priority.URGENT].breached) / prioritySla[Priority.URGENT].total) * 100) : 100}% compliant)`,
          },
          {
            label: 'HIGH (Target: 24 Hours)',
            value: `${prioritySla[Priority.HIGH].total} complaints — ${prioritySla[Priority.HIGH].breached} breached (${prioritySla[Priority.HIGH].total > 0 ? Math.round(((prioritySla[Priority.HIGH].total - prioritySla[Priority.HIGH].breached) / prioritySla[Priority.HIGH].total) * 100) : 100}% compliant)`,
          },
          {
            label: 'MEDIUM (Target: 48 Hours)',
            value: `${prioritySla[Priority.MEDIUM].total} complaints — ${prioritySla[Priority.MEDIUM].breached} breached (${prioritySla[Priority.MEDIUM].total > 0 ? Math.round(((prioritySla[Priority.MEDIUM].total - prioritySla[Priority.MEDIUM].breached) / prioritySla[Priority.MEDIUM].total) * 100) : 100}% compliant)`,
          },
          {
            label: 'LOW (Target: 72 Hours)',
            value: `${prioritySla[Priority.LOW].total} complaints — ${prioritySla[Priority.LOW].breached} breached (${prioritySla[Priority.LOW].total > 0 ? Math.round(((prioritySla[Priority.LOW].total - prioritySla[Priority.LOW].breached) / prioritySla[Priority.LOW].total) * 100) : 100}% compliant)`,
          },
        ],
      },
    ],
  };
}
