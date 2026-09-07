// =============================================================================
// CivicConnect TN — Multi-Format Report Export API (/api/reports/generate)
// =============================================================================
// Generates official PDF, Excel (.xlsx), and CSV reports from real database data.

import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/lib/reports/service';
import { ExportFormat, ReportFilterOptions, ReportType } from '@/lib/reports/types';

export async function GET(request: NextRequest) {
  return handleExport(request);
}

export async function POST(request: NextRequest) {
  return handleExport(request);
}

async function handleExport(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    let bodyData: any = {};
    if (request.method === 'POST') {
      try {
        bodyData = await request.json();
      } catch {
        // use query params if body parsing fails
      }
    }

    const type = (searchParams.get('type') ||
      searchParams.get('report_type') ||
      bodyData.type ||
      bodyData.report_type ||
      'complaint_summary') as ReportType;

    const format = (searchParams.get('format') || bodyData.format || 'pdf').toLowerCase() as ExportFormat;

    const filters: ReportFilterOptions = {
      startDate: searchParams.get('start_date') || bodyData.startDate,
      endDate: searchParams.get('end_date') || bodyData.endDate,
      timeRange: (searchParams.get('time_range') || bodyData.timeRange || '30d') as any,
      departmentId: searchParams.get('department_id') || bodyData.departmentId,
      categoryId: searchParams.get('category_id') || bodyData.categoryId,
      district: searchParams.get('district') || bodyData.district,
      ward: searchParams.get('ward') ? parseInt(searchParams.get('ward')!, 10) : bodyData.ward,
      priority: searchParams.get('priority') || bodyData.priority,
      status: searchParams.get('status') || bodyData.status,
    };

    const result = await ReportService.exportReport(type, format, filters);

    return new NextResponse(result.buffer as any, {
      status: 200,
      headers: {
        'Content-Type': result.mimeType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length': String(result.sizeBytes),
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('[API /reports/generate Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to generate report',
      },
      { status: 500 }
    );
  }
}
