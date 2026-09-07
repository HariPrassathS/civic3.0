// =============================================================================
// CivicConnect TN — Predictive Risks & Early Warnings API Route
// =============================================================================
// GET: Fetches role-scoped predictive risks, emerging patterns & future problem areas.
// POST: Dispatches or acknowledges preventative action work orders.

import { NextRequest, NextResponse } from 'next/server';
import { executePredictiveAnalyticsPipeline, ACTION_DISPATCH_STORE } from '@/lib/predictive/pipeline';
import { PredictiveFilterState } from '@/lib/predictive/types';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const role = searchParams.get('role') || 'citizen';
    const timeHorizon = (searchParams.get('timeHorizon') as any) || 'all';
    const riskLevel = (searchParams.get('riskLevel') as any) || 'all';
    const category = searchParams.get('category') || 'all';
    const departmentId = searchParams.get('departmentId') || 'all';
    const district = searchParams.get('district') || 'all';
    const wardStr = searchParams.get('ward');
    const ward = wardStr && wardStr !== 'all' ? parseInt(wardStr, 10) : undefined;

    const filters: PredictiveFilterState = {
      role,
      timeHorizon,
      riskLevel,
      category,
      departmentId,
      district,
      ward,
    };

    // Attempt to fetch fresh database complaints to augment seed dataset
    let externalComplaints: any[] = [];
    try {
      const supabase = createAdminClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('complaints')
          .select('*, categories(name), departments(name, code)')
          .limit(250);

        if (!error && Array.isArray(data)) {
          externalComplaints = data.map((c: any) => ({
            ...c,
            category_name: c.categories?.name,
            department_name: c.departments?.name,
            latitude: c.latitude || (c.location ? c.location.lat : null),
            longitude: c.longitude || (c.location ? c.location.lng : null),
          }));
        }
      }
    } catch {
      // Gracefully fall back to comprehensive historical seed records
    }

    const response = executePredictiveAnalyticsPipeline(externalComplaints, filters);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('Error executing predictive analytics pipeline:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute predictive analytics engine',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action_id, status, dispatched_by } = body;

    if (!action_id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: action_id and status' },
        { status: 400 }
      );
    }

    ACTION_DISPATCH_STORE.set(action_id, {
      status,
      dispatched_at: new Date().toISOString(),
      dispatched_by: dispatched_by || 'Field Operations Officer',
    });

    return NextResponse.json({
      success: true,
      message: `Preventative Action ${action_id} updated to ${status}`,
      data: {
        action_id,
        status,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error dispatching preventative action:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update preventative action' },
      { status: 500 }
    );
  }
}
