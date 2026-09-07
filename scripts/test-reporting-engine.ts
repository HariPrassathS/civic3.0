// =============================================================================
// CivicConnect TN — Comprehensive Reporting & Multi-Format Export Test Suite
// =============================================================================

import { ReportService } from '../lib/reports/service';
import { ExportFormat, ReportType } from '../lib/reports/types';
import { MASTER_DEPARTMENTS, MASTER_CATEGORIES } from '../lib/complaints/categories';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${testName}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${testName}${detail ? ` -> ${detail}` : ''}`);
  }
}

async function runTests() {
  console.log('\n=============================================================================');
  console.log('  CIVICCONNECT TN — PHASE 15 REPORTING ENGINE TEST SUITE');
  console.log('=============================================================================\n');

  const reportTypes: ReportType[] = [
    'complaint_summary',
    'department_performance',
    'sla_performance',
    'escalation_report',
    'resolution_report',
    'dmt_report',
    'hotspot_report',
    'predictive_insight_report',
  ];

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: ALL 8 REPORT DOMAIN AGGREGATORS
  // ---------------------------------------------------------------------------
  console.log('\x1b[36m--- Group 1: All 8 Domain Aggregators ---\x1b[0m');

  for (const reportType of reportTypes) {
    const payload = await ReportService.generateReportPayload(reportType, { timeRange: '90d' });

    assert(Boolean(payload), `[${reportType}] Generates payload`);
    assert(payload.metadata.reportType === reportType, `[${reportType}] Metadata has correct reportType`);
    assert(Boolean(payload.metadata.title), `[${reportType}] Metadata contains title: "${payload.metadata.title.slice(0, 30)}..."`);
    assert(Array.isArray(payload.kpis) && payload.kpis.length >= 3, `[${reportType}] Returns ${payload.kpis.length} KPI summary cards`);
    assert(Array.isArray(payload.columns) && payload.columns.length >= 5, `[${reportType}] Returns ${payload.columns.length} table columns`);
    assert(Array.isArray(payload.rows), `[${reportType}] Returns data rows array (count: ${payload.rows.length})`);
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: ALL 3 EXPORT FORMATS (PDF, EXCEL, CSV)
  // ---------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Group 2: All 3 Export Formats ---\x1b[0m');

  const formats: ExportFormat[] = ['csv', 'excel', 'pdf'];

  for (const fmt of formats) {
    const result = await ReportService.exportReport('complaint_summary', fmt, { timeRange: '30d' });

    assert(Boolean(result), `[${fmt.toUpperCase()}] Export returns result object`);
    assert(result.buffer && result.sizeBytes > 0, `[${fmt.toUpperCase()}] Non-empty buffer generated (${result.sizeBytes} bytes)`);
    assert(result.filename.endsWith(`.${fmt === 'excel' ? 'xlsx' : fmt}`), `[${fmt.toUpperCase()}] Valid filename: ${result.filename}`);

    if (fmt === 'csv') {
      const csvStr = result.buffer.toString('utf-8');
      assert(csvStr.charCodeAt(0) === 0xfeff, '[CSV] Contains UTF-8 Byte Order Mark (BOM)');
      assert(csvStr.includes('# CIVICCONNECT TN'), '[CSV] Contains Government metadata commentary headers');
      assert(csvStr.includes('Tracking ID'), '[CSV] Contains proper column headers');
    }

    if (fmt === 'excel') {
      assert(result.mimeType.includes('spreadsheetml'), '[EXCEL] Valid XLSX MIME type');
      assert(result.sizeBytes > 2000, `[EXCEL] Valid OpenXML size: ${result.sizeBytes} bytes`);
    }

    if (fmt === 'pdf') {
      assert(result.mimeType === 'application/pdf', '[PDF] Valid PDF MIME type');
      const pdfHeader = result.buffer.toString('ascii', 0, 5);
      assert(pdfHeader === '%PDF-', `[PDF] Magic bytes verify valid PDF file: "${pdfHeader}"`);
    }
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: 7 FILTER DIMENSIONS
  // ---------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Group 3: Multi-Dimensional Filter Engine ---\x1b[0m');

  // Filter: District
  const districtFiltered = await ReportService.generateReportPayload('complaint_summary', {
    district: 'Chennai',
    timeRange: 'all',
  });
  assert(
    districtFiltered.rows.length === 0 || districtFiltered.rows.every((r) => r.district.toLowerCase() === 'chennai'),
    'Filter by District (Chennai) applied correctly'
  );

  // Filter: Priority
  const urgentFiltered = await ReportService.generateReportPayload('complaint_summary', {
    priority: 'urgent',
    timeRange: 'all',
  });
  assert(
    urgentFiltered.rows.length === 0 || urgentFiltered.rows.every((r) => r.priority.toLowerCase() === 'urgent'),
    'Filter by Priority (URGENT) applied correctly'
  );

  // Filter: Status
  const resolvedFiltered = await ReportService.generateReportPayload('complaint_summary', {
    status: 'resolved',
    timeRange: 'all',
  });
  assert(
    resolvedFiltered.rows.length === 0 || resolvedFiltered.rows.every((r) => r.status.toLowerCase() === 'resolved'),
    'Filter by Status (RESOLVED) applied correctly'
  );

  // Filter: Ward
  const wardFiltered = await ReportService.generateReportPayload('complaint_summary', {
    ward: 5,
    timeRange: 'all',
  });
  assert(
    wardFiltered.rows.length === 0 || wardFiltered.rows.every((r) => r.ward === 5),
    'Filter by Ward (5) applied correctly'
  );

  // Filter: Time Range (Today)
  const todayFiltered = await ReportService.generateReportPayload('complaint_summary', {
    timeRange: 'today',
  });
  assert(todayFiltered.metadata.dateScope === 'Today', 'Filter by Date Preset (Today) resolves metadata scope');

  // ---------------------------------------------------------------------------
  // TEST GROUP 4: ZERO CRASH & DATA INTEGRITY
  // ---------------------------------------------------------------------------
  console.log('\n\x1b[36m--- Group 4: Zero-Crash & Data Integrity ---\x1b[0m');

  // Test unconfigured / empty filter fallback
  const emptyFilterReport = await ReportService.exportReport('predictive_insight_report', 'pdf', {});
  assert(emptyFilterReport.sizeBytes > 0, 'Predictive insight PDF builds cleanly with empty filter payload');

  const dmtExcelReport = await ReportService.exportReport('dmt_report', 'excel', {});
  assert(dmtExcelReport.sizeBytes > 0, 'DMT cluster report Excel builds cleanly without throwing errors');

  const hotspotCsvReport = await ReportService.exportReport('hotspot_report', 'csv', {});
  assert(hotspotCsvReport.sizeBytes > 0, 'Hotspot CSV builds cleanly without throwing errors');

  console.log('\n=============================================================================');
  console.log(`  REPORTING TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('=============================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
