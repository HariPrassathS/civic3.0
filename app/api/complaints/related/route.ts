// =============================================================================
// CivicConnect TN — Related Community Issues API (/api/complaints/related)
// =============================================================================
// Returns privacy-safe public complaints from the same ward/category area.
// Never exposes citizen personal information.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MEMORY_COMPLAINTS } from '@/lib/complaints/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const ward = searchParams.get('ward');
    const categoryId = searchParams.get('category_id');
    const excludeId = searchParams.get('exclude_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 10);

    if (!ward && !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Provide at least ward or category_id' },
        { status: 400 }
      );
    }

    // 1. Try Supabase
    try {
      const supabase = createAdminClient();
      let query = supabase
        .from('complaints')
        .select('tracking_id, title, status, priority, address, ward, district, created_at')
        .eq('is_public', true);

      if (ward) {
        query = query.eq('ward', parseInt(ward, 10));
      }
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      if (excludeId) {
        query = query.neq('id', excludeId).neq('tracking_id', excludeId);
      }

      query = query.order('created_at', { ascending: false }).limit(limit);

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        return NextResponse.json({
          success: true,
          data: {
            related: data,
            count: data.length,
          },
        });
      }
    } catch {
      // Fall through to memory
    }

    // 2. Fallback: in-memory store
    const memResults = MEMORY_COMPLAINTS
      .filter((c) => {
        if (!c.is_public) return false;
        if (excludeId && (c.id === excludeId || c.tracking_id === excludeId)) return false;
        if (ward && c.ward !== parseInt(ward, 10)) return false;
        if (categoryId && c.category_id !== categoryId) return false;
        return true;
      })
      .slice(0, limit)
      .map((c) => ({
        tracking_id: c.tracking_id,
        title: c.title,
        status: c.status,
        priority: c.priority,
        address: c.address,
        ward: c.ward,
        district: c.district,
        created_at: c.created_at,
      }));

    return NextResponse.json({
      success: true,
      data: {
        related: memResults,
        count: memResults.length,
      },
    });
  } catch (error) {
    console.error('[/api/complaints/related error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch related issues' },
      { status: 500 }
    );
  }
}
