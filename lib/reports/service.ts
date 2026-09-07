// =============================================================================
// CivicConnect TN — Unified Report Service (Facade Orchestrator)
// =============================================================================

import { ExportFormat, ExportResult, ReportDataPayload, ReportFilterOptions, ReportType } from './types';
import { fetchReportComplaints } from './data-fetcher';
import { aggregateComplaintSummary } from './aggregators/complaint-summary';
import { aggregateDepartmentPerformance } from './aggregators/department-performance';
import { aggregateSlaPerformance } from './aggregators/sla-performance';
import { aggregateEscalationReport } from './aggregators/escalation-report';
import { aggregateResolutionReport } from './aggregators/resolution-report';
import { aggregateDmtReport } from './aggregators/dmt-report';
import { aggregateHotspotReport } from './aggregators/hotspot-report';
import { aggregatePredictiveInsightReport } from './aggregators/predictive-insight-report';
import { exportReportToCsv } from './exporters/csv-exporter';
import { exportReportToExcel } from './exporters/excel-exporter';
import { exportReportToPdf } from './exporters/pdf-exporter';

export class ReportService {
  /**
   * Generates the structured data payload for any of the 8 report types using real DB data.
   */
  public static async generateReportPayload(
    reportType: ReportType,
    filters: ReportFilterOptions = {}
  ): Promise<ReportDataPayload> {
    const { complaints, filtersSummary, dateLabel } = await fetchReportComplaints(filters);

    switch (reportType) {
      case 'complaint_summary':
        return aggregateComplaintSummary(complaints, filters, filtersSummary, dateLabel);

      case 'department_performance':
        return aggregateDepartmentPerformance(complaints, filters, filtersSummary, dateLabel);

      case 'sla_performance':
        return aggregateSlaPerformance(complaints, filters, filtersSummary, dateLabel);

      case 'escalation_report':
        return aggregateEscalationReport(complaints, filters, filtersSummary, dateLabel);

      case 'resolution_report':
        return aggregateResolutionReport(complaints, filters, filtersSummary, dateLabel);

      case 'dmt_report':
        return aggregateDmtReport(complaints, filters, filtersSummary, dateLabel);

      case 'hotspot_report':
        return aggregateHotspotReport(complaints, filters, filtersSummary, dateLabel);

      case 'predictive_insight_report':
        return aggregatePredictiveInsightReport(complaints, filters, filtersSummary, dateLabel);

      default:
        return aggregateComplaintSummary(complaints, filters, filtersSummary, dateLabel);
    }
  }

  /**
   * Exports a report into the requested format (PDF, Excel, or CSV).
   */
  public static async exportReport(
    reportType: ReportType,
    format: ExportFormat,
    filters: ReportFilterOptions = {}
  ): Promise<ExportResult> {
    const payload = await this.generateReportPayload(reportType, filters);

    switch (format) {
      case 'pdf':
        return exportReportToPdf(payload);

      case 'excel':
        return await exportReportToExcel(payload);

      case 'csv':
        return exportReportToCsv(payload);

      default:
        return exportReportToCsv(payload);
    }
  }
}
