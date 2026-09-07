// =============================================================================
// CivicConnect TN — Data Mining & Visual Analytics API (/api/data-mining/dbscan)
// =============================================================================
// Returns unified real-data governance metrics, animated chart datasets,
// and DBSCAN spatial-temporal density clusters.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { executeUnifiedAnalyticsPipeline } from '@/lib/data-mining/pipeline';
import { AnalyticsFilterState } from '@/lib/data-mining/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const epsilonParam = searchParams.get('epsilon');
    const minPtsParam = searchParams.get('min_pts');
    const timeRangeParam = searchParams.get('time_range') as '7d' | '30d' | '90d' | '1y' | 'all';
    const districtParam = searchParams.get('district');
    const wardParam = searchParams.get('ward');
    const categoryParam = searchParams.get('category_id');
    const departmentParam = searchParams.get('department_id');
    const priorityParam = searchParams.get('priority');
    const statusParam = searchParams.get('status');

    const filters: AnalyticsFilterState = {
      epsilonKm: epsilonParam ? parseFloat(epsilonParam) : 0.5,
      minPts: minPtsParam ? parseInt(minPtsParam, 10) : 3,
      timeRange: timeRangeParam || '90d',
      district: districtParam || undefined,
      ward: wardParam ? parseInt(wardParam, 10) : undefined,
      categoryId: categoryParam || undefined,
      departmentId: departmentParam || undefined,
      priority: priorityParam || undefined,
      status: statusParam || undefined,
    };

    // Attempt to pull live database complaints from Supabase
    let dbComplaints: any[] = [];
    try {
      const supabase = createAdminClient();
      let query = supabase
        .from('complaints')
        .select(`
          *,
          category:categories(name, code),
          department:departments(name, code),
          upvotes(user_id)
        `);

      if (filters.district && filters.district !== 'all' && filters.district !== 'All Districts') {
        query = query.ilike('district', filters.district);
      }
      if (filters.ward !== undefined) {
        query = query.eq('ward', filters.ward);
      }
      if (filters.priority && filters.priority !== 'all' && filters.priority !== 'All Priorities') {
        query = query.eq('priority', filters.priority.toLowerCase() as any);
      }
      if (filters.status && filters.status !== 'all' && filters.status !== 'All Statuses') {
        query = query.eq('status', filters.status.toLowerCase() as any);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        dbComplaints = data.map((d: any) => ({
          ...d,
          upvotes_count: d.upvotes?.length || 0,
        }));
      }
    } catch {
      // Graceful fallback to memory & seed store
    }

    // Execute Unified Visual Analytics & Data Mining Pipeline
    const pipelineResult = executeUnifiedAnalyticsPipeline(dbComplaints, filters);

    return NextResponse.json({
      success: true,
      data: pipelineResult,
    });
  } catch (error) {
    console.error('[/api/data-mining/dbscan error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute DBSCAN visual analytics pipeline.' },
      { status: 500 }
    );
  }
}
