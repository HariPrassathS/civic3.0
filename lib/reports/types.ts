// =============================================================================
// CivicConnect TN — Professional Reporting & Export Engine Types
// =============================================================================

import { ComplaintStatus, Priority } from '@/types/enums';

export type ReportType =
  | 'complaint_summary'
  | 'department_performance'
  | 'sla_performance'
  | 'escalation_report'
  | 'resolution_report'
  | 'dmt_report'
  | 'hotspot_report'
  | 'predictive_insight_report';

export type ExportFormat = 'pdf' | 'excel' | 'csv';

export type TimeRangePreset = 'today' | '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

export interface ReportFilterOptions {
  startDate?: string;
  endDate?: string;
  timeRange?: TimeRangePreset;
  departmentId?: string;
  categoryId?: string;
  district?: string;
  ward?: number;
  priority?: Priority | 'all' | string;
  status?: ComplaintStatus | 'all' | string;
}

export interface ReportMetadata {
  reportType: ReportType;
  title: string;
  subtitle: string;
  description: string;
  generatedAt: string;
  generatedBy: string;
  organization: string;
  departmentScope: string;
  districtScope: string;
  dateScope: string;
  totalRecords: number;
  filtersApplied: Record<string, string>;
}

export interface ReportKpiCard {
  key: string;
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

export interface ReportTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: number; // suggested width percentage or px
  formatter?: 'text' | 'date' | 'badge' | 'number' | 'percentage' | 'hours';
}

export interface ReportSummarySection {
  title: string;
  items: {
    label: string;
    value: string | number;
    subtext?: string;
  }[];
}

export interface ReportDataPayload {
  metadata: ReportMetadata;
  kpis: ReportKpiCard[];
  columns: ReportTableColumn[];
  rows: Record<string, any>[];
  summarySections?: ReportSummarySection[];
  chartsData?: Record<string, any>;
}

export interface ExportResult {
  buffer: Buffer | Uint8Array;
  mimeType: string;
  filename: string;
  format: ExportFormat;
  sizeBytes: number;
}
