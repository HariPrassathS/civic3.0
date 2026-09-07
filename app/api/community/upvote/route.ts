import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MEMORY_COMPLAINTS } from '@/lib/complaints/service';
import { GlobalRateLimiter, getClientIp } from '@/lib/security/rate-limiter';

// In-memory upvote tracking set: `${userId}:${complaintId}`
const MEMORY_UPVOTES = new Set<string>();

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = GlobalRateLimiter.check(`upvote:${clientIp}`, {
      windowMs: 60 * 1000,
      maxRequests: 60,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Upvote rate limit reached. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }

    const user = await getCurrentUser();
    const body = await request.json();
    const { complaint_id } = body;

    if (!complaint_id) {
      return NextResponse.json(
        { success: false, error: 'complaint_id is required' },
        { status: 400 }
      );
    }

    const userId = user?.id || 'dev-user-citizen';
    const upvoteKey = `${userId}:${complaint_id}`;

    let isUpvoted: boolean;
    let newCount: number;

    const memComplaint = MEMORY_COMPLAINTS.find(
      (c) => c.id === complaint_id || c.tracking_id === complaint_id
    );

    if (MEMORY_UPVOTES.has(upvoteKey)) {
      // Toggle off (remove upvote)
      MEMORY_UPVOTES.delete(upvoteKey);
      isUpvoted = false;
      if (memComplaint) {
        memComplaint.upvotes_count = Math.max(0, (memComplaint.upvotes_count || 1) - 1);
        newCount = memComplaint.upvotes_count;
      } else {
        newCount = 0;
      }
    } else {
      // Toggle on (add upvote)
      MEMORY_UPVOTES.add(upvoteKey);
      isUpvoted = true;
      if (memComplaint) {
        memComplaint.upvotes_count = (memComplaint.upvotes_count || 0) + 1;
        newCount = memComplaint.upvotes_count;
      } else {
        newCount = 1;
      }
    }

    // Try Supabase database toggle
    try {
      const supabase = createAdminClient();
      if (isUpvoted) {
        await supabase.from('upvotes').insert({
          complaint_id,
          user_id: userId,
        });
      } else {
        await supabase
          .from('upvotes')
          .delete()
          .eq('complaint_id', complaint_id)
          .eq('user_id', userId);
      }
    } catch {
      // Memory fallback
    }

    return NextResponse.json({
      success: true,
      data: {
        complaint_id,
        is_upvoted: isUpvoted,
        upvotes_count: newCount,
      },
    });
  } catch (error) {
    console.error('[/api/community/upvote error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle upvote' },
      { status: 500 }
    );
  }
}
