// =============================================================================
// CivicConnect TN — Real-Time Report Preview API (/api/reports/preview)
// =============================================================================
// Returns live KPI summaries, metadata, table schemas, and data rows before exporting.

import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/lib/reports/service';
import { ReportFilterOptions, ReportType } from '@/lib/reports/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const type = (searchParams.get('type') ||
      searchParams.get('report_type') ||
      'complaint_summary') as ReportType;

    const filters: ReportFilterOptions = {
      startDate: searchParams.get('start_date') || undefined,
      endDate: searchParams.get('end_date') || undefined,
      timeRange: (searchParams.get('time_range') || '30d') as any,
      departmentId: searchParams.get('department_id') || undefined,
      categoryId: searchParams.get('category_id') || undefined,
      district: searchParams.get('district') || undefined,
      ward: searchParams.get('ward') ? parseInt(searchParams.get('ward')!, 10) : undefined,
      priority: searchParams.get('priority') || undefined,
      status: searchParams.get('status') || undefined,
    };

    const payload = await ReportService.generateReportPayload(type, filters);

    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (error: any) {
    console.error('[API /reports/preview Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to generate report preview',
      },
      { status: 500 }
    );
  }
}
