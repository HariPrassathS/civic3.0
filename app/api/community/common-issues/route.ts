// =============================================================================
// CivicConnect TN — Common Issues Relationship API (/api/community/common-issues)
// =============================================================================
// Returns grouped spatial clusters of common civic failures reported by multiple citizens.

import { NextRequest, NextResponse } from 'next/server';
import { MEMORY_COMPLAINTS } from '@/lib/complaints/service';
import { buildCommonIssueClusters } from '@/lib/community/common-issues';

import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const district = searchParams.get('district');

    let publicComplaints: any[] = [];

    try {
      const supabase = createAdminClient();
      let query = supabase
        .from('complaints')
        .select(`
          *,
          category:categories(name, code),
          department:departments(name, code),
          media:complaint_media(id, url, media_type, storage_path, phase, ai_analysis, created_at),
          upvotes(user_id),
          comments(id)
        `)
        .eq('is_public', true);

      if (district && district !== 'all' && district !== 'All Districts') {
        query = query.ilike('district', district);
      }

      const { data, error } = await query;
      if (!error && data) {
        publicComplaints = data.map((item: any) => ({
          ...item,
          upvotes_count: item.upvotes?.length || 0,
          comments_count: item.comments?.length || 0,
        }));
      } else if (error) {
        publicComplaints = MEMORY_COMPLAINTS.filter((c) => c.is_public);
      }
    } catch {
      publicComplaints = MEMORY_COMPLAINTS.filter((c) => c.is_public);
    }

    const { clusters } = buildCommonIssueClusters(publicComplaints);

    return NextResponse.json({
      success: true,
      data: {
        total_clusters: clusters.length,
        clusters,
      },
    });
  } catch (error) {
    console.error('[/api/community/common-issues error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to build common issue clusters' },
      { status: 500 }
    );
  }
}
