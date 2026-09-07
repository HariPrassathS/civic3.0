// =============================================================================
// CivicConnect TN — Community Issues Feed API (/api/community/issues)
// =============================================================================
// Returns privacy-sanitized public civic complaints with upvote counts,
// comment counts, and common issue relationship metadata.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { MEMORY_COMPLAINTS } from '@/lib/complaints/service';
import { buildCommonIssueClusters } from '@/lib/community/common-issues';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? await verifySessionToken(token) : null;

    const { searchParams } = request.nextUrl;
    const sort = searchParams.get('sort') || 'top';
    const district = searchParams.get('district');
    const categoryId = searchParams.get('category_id');
    const status = searchParams.get('status');

    let rawList: any[] = [];

    // Try Supabase database query
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
      if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
      }
      if (status && status !== 'all') {
        query = query.eq('status', status as any);
      }

      const { data, error } = await query;
      if (!error && data) {
        // Generate signed URLs for media in private bucket 'complaint-evidence'
        const signedPromises: Promise<void>[] = [];
        for (const item of (data as any[])) {
          if (Array.isArray(item.media)) {
            for (const m of item.media) {
              if (m.storage_path) {
                signedPromises.push(
                  supabase.storage
                    .from('complaint-evidence')
                    .createSignedUrl(m.storage_path, 86400)
                    .then(({ data: sData, error: sErr }) => {
                      if (!sErr && sData?.signedUrl) {
                        m.url = sData.signedUrl;
                      }
                    })
                    .catch(() => {})
                );
              }
            }
          }
        }
        if (signedPromises.length > 0) {
          await Promise.all(signedPromises);
        }

        rawList = data.map((item: any) => ({
          ...item,
          upvotes_count: item.upvotes?.length || 0,
          comments_count: item.comments?.length || 0,
        }));
      } else if (error) {
        rawList = MEMORY_COMPLAINTS.filter((c) => c.is_public);
      }
    } catch {
      rawList = MEMORY_COMPLAINTS.filter((c) => c.is_public);
    }

    // Filter memory list
    if (district && district !== 'all' && district !== 'All Districts') {
      rawList = rawList.filter((i) => i.district?.toLowerCase() === district.toLowerCase());
    }
    if (categoryId && categoryId !== 'all') {
      rawList = rawList.filter((i) => i.category_id === categoryId);
    }
    if (status && status !== 'all') {
      rawList = rawList.filter((i) => i.status === status);
    }

    // Build common issue relationships & sanitize for privacy
    const { clusters, enrichedComplaints } = buildCommonIssueClusters(rawList, user?.id);

    let finalIssues = enrichedComplaints;

    // Sorting
    if (sort === 'top') {
      finalIssues.sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0));
    } else if (sort === 'recent') {
      finalIssues.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === 'urgent') {
      finalIssues.sort((a, b) => (a.priority === 'urgent' ? -1 : b.priority === 'urgent' ? 1 : 0));
    } else if (sort === 'common') {
      finalIssues = finalIssues.filter((i) => i.is_common_issue);
      finalIssues.sort((a, b) => (b.common_reports_count || 0) - (a.common_reports_count || 0));
    } else if (sort === 'resolved') {
      finalIssues = finalIssues.filter((i) => i.status === 'resolved' || i.status === 'closed');
      finalIssues.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return NextResponse.json({
      success: true,
      data: {
        count: finalIssues.length,
        common_clusters_count: clusters.length,
        issues: finalIssues,
        common_clusters: clusters,
      },
    });
  } catch (error) {
    console.error('[/api/community/issues error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch community issues' },
      { status: 500 }
    );
  }
}
