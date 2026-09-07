// =============================================================================
// CivicConnect TN — Executive Complaint Summary Aggregator
// =============================================================================

import { ComplaintStatus, Priority } from '@/types/enums';
import { EnrichedComplaintRecord } from '../data-fetcher';
import { ReportDataPayload, ReportFilterOptions } from '../types';

export function aggregateComplaintSummary(
  complaints: EnrichedComplaintRecord[],
  filters: ReportFilterOptions,
  filtersSummary: Record<string, string>,
  dateLabel: string
): ReportDataPayload {
  const total = complaints.length;
  const resolvedCount = complaints.filter(
    (c) =>
      c.status === ComplaintStatus.RESOLVED ||
      c.status === ComplaintStatus.CLOSED ||
      c.status === ComplaintStatus.OFFICER_VERIFICATION
  ).length;
  const activeCount = total - resolvedCount;
  const urgentCount = complaints.filter((c) => c.priority === Priority.URGENT).length;
  const breachedCount = complaints.filter((c) => c.is_breached).length;
  const slaCompliance = total > 0 ? Math.round(((total - breachedCount) / total) * 100) : 100;
  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  // Status Breakdown
  const statusMap: Record<string, number> = {};
  complaints.forEach((c) => {
    statusMap[c.status] = (statusMap[c.status] || 0) + 1;
  });

  // Category Distribution
  const categoryMap: Record<string, number> = {};
  complaints.forEach((c) => {
    categoryMap[c.category_name] = (categoryMap[c.category_name] || 0) + 1;
  });

  // District Breakdown
  const districtMap: Record<string, number> = {};
  complaints.forEach((c) => {
    districtMap[c.district] = (districtMap[c.district] || 0) + 1;
  });

  // Top categories
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, count]) => ({
      label: cat,
      value: `${count} (${total > 0 ? Math.round((count / total) * 100) : 0}%)`,
    }));

  // Table Columns
  const columns = [
    { key: 'tracking_id', label: 'Tracking ID', width: 14, formatter: 'text' as const },
    { key: 'created_at', label: 'Reported Date', width: 12, formatter: 'date' as const },
    { key: 'district', label: 'District', width: 11, formatter: 'text' as const },
    { key: 'ward', label: 'Ward', width: 7, formatter: 'number' as const, align: 'center' as const },
    { key: 'department_code', label: 'Dept', width: 10, formatter: 'text' as const },
    { key: 'category_name', label: 'Category', width: 18, formatter: 'text' as const },
    { key: 'priority', label: 'Priority', width: 9, formatter: 'badge' as const, align: 'center' as const },
    { key: 'status', label: 'Status', width: 10, formatter: 'badge' as const, align: 'center' as const },
    { key: 'sla_status', label: 'SLA Status', width: 9, formatter: 'badge' as const, align: 'center' as const },
  ];

  // Table Rows
  const rows = complaints.map((c) => {
    let slaStatus = 'On Track';
    if (c.is_breached) slaStatus = 'Breached';
    else if (c.is_sla_approaching) slaStatus = '75% Warning';
    else if (
      c.status === ComplaintStatus.CLOSED ||
      c.status === ComplaintStatus.RESOLVED ||
      c.status === ComplaintStatus.OFFICER_VERIFICATION
    ) {
      slaStatus = 'Met SLA';
    }

    return {
      tracking_id: c.tracking_id,
      created_at: c.created_at.slice(0, 10),
      district: c.district,
      ward: c.ward,
      department_code: c.department_code,
      department_name: c.department_name,
      category_name: c.category_name,
      priority: c.priority.toUpperCase(),
      status: c.status.toUpperCase(),
      sla_status: slaStatus,
      title: c.title,
      address: c.address,
      turnaround_hours: c.turnaround_hours || '—',
    };
  });

  return {
    metadata: {
      reportType: 'complaint_summary',
      title: 'Executive Grievance & Complaint Summary',
      subtitle: 'Comprehensive analysis of public civic grievances, priority allocation, and municipal status',
      description: 'Official consolidated summary for district collectors, municipal commissioners, and administrative heads.',
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
      { key: 'total', label: 'Total Grievances', value: total, unit: 'Complaints', tone: 'info', subtext: 'Registered within filter scope' },
      { key: 'resolved', label: 'Resolved / Closed', value: resolvedCount, unit: `(${resolutionRate}%)`, tone: 'success', subtext: 'Successfully processed' },
      { key: 'active', label: 'Active Caseload', value: activeCount, unit: 'Pending', tone: 'warning', subtext: 'In progress or assigned' },
      { key: 'urgent', label: 'Urgent Priority', value: urgentCount, unit: 'Critical', tone: urgentCount > 0 ? 'danger' : 'neutral', subtext: '< 12h SLA target' },
      { key: 'sla', label: 'SLA Compliance Rate', value: `${slaCompliance}%`, tone: slaCompliance >= 85 ? 'success' : slaCompliance >= 70 ? 'warning' : 'danger', subtext: 'On-time delivery' },
    ],
    columns,
    rows,
    summarySections: [
      {
        title: 'Top Grievance Categories',
        items: topCategories,
      },
      {
        title: 'Status Distribution',
        items: Object.entries(statusMap).map(([status, count]) => ({
          label: status.replace(/_/g, ' ').toUpperCase(),
          value: count,
        })),
      },
      {
        title: 'District Grievance Volume',
        items: Object.entries(districtMap).map(([dist, count]) => ({
          label: dist,
          value: `${count} grievances`,
        })),
      },
    ],
  };
}
