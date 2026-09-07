// =============================================================================
// CivicConnect TN — Community Comments API Route (/api/community/comments)
// =============================================================================
// Returns and posts privacy-sanitized discussion comments on public complaints.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { maskPii } from '@/lib/ai/client';
import { sanitizeAuthorName, SanitizedComment } from '@/lib/community/sanitizer';
import { GlobalRateLimiter, getClientIp } from '@/lib/security/rate-limiter';

interface CommentMemoryItem {
  id: string;
  complaint_id: string;
  user_id: string;
  author_name: string;
  author_badge: string;
  is_official: boolean;
  content: string;
  created_at: string;
}

const MEMORY_COMMENTS: CommentMemoryItem[] = [
  {
    id: 'comm-1',
    complaint_id: 'CC-TN-2026-104921',
    user_id: 'user-citizen-1',
    author_name: 'Concerned Resident (Ward 114)',
    author_badge: 'Citizen',
    is_official: false,
    content: 'This pothole caused an auto-rickshaw to overturn yesterday evening. Extremely dangerous during rainfall!',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: 'comm-2',
    complaint_id: 'CC-TN-2026-104921',
    user_id: 'officer-ae-1',
    author_name: 'Anand Kumar, AE Ward 114',
    author_badge: 'Verified Official',
    is_official: true,
    content: 'Official Update: GCC Road Maintenance Division has inspected the spot. Bitumen patchwork is scheduled tonight at 11 PM.',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const complaintId = searchParams.get('complaint_id');

    if (!complaintId) {
      return NextResponse.json(
        { success: false, error: 'complaint_id parameter is required.' },
        { status: 400 }
      );
    }

    let results: SanitizedComment[] = MEMORY_COMMENTS.filter(
      (c) => c.complaint_id === complaintId || c.complaint_id.includes(complaintId)
    );

    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('comments')
        .select('id, complaint_id, content, is_official, created_at, user:profiles(display_name, role, ward_id, department_id)')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        results = data.map((item: any) => {
          const profile = item.user || {};
          const authorMeta = sanitizeAuthorName(
            profile.display_name,
            profile.role,
            profile.ward_id,
            profile.department_id
          );

          return {
            id: item.id,
            complaint_id: item.complaint_id,
            author_name: authorMeta.author_name,
            author_badge: authorMeta.author_badge,
            is_official: item.is_official || authorMeta.is_official,
            content: maskPii(item.content),
            created_at: item.created_at,
          };
        });
      }
    } catch {
      // Memory fallback
    }

    return NextResponse.json({
      success: true,
      data: {
        count: results.length,
        comments: results,
      },
    });
  } catch (error) {
    console.error('[/api/community/comments GET error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve comments.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = GlobalRateLimiter.check(`comment:${clientIp}`, {
      windowMs: 60 * 1000,
      maxRequests: 20,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `Comment rate limit exceeded. Please wait ${rateLimit.retryAfterSeconds}s.` },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? await verifySessionToken(token) : null;

    const body = await request.json();
    const { complaint_id, content } = body;

    if (!complaint_id || !content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'complaint_id and comment content are required.' },
        { status: 400 }
      );
    }

    if (content.trim().length > 500) {
      return NextResponse.json(
        { success: false, error: 'Comments cannot exceed 500 characters.' },
        { status: 400 }
      );
    }

    // Mask PII from comment content
    const sanitizedContent = maskPii(content.trim());

    const authorMeta = sanitizeAuthorName(
      user?.display_name,
      user?.role,
      (user as any)?.ward_id,
      (user as any)?.department_id
    );

    const newComment: CommentMemoryItem = {
      id: `comm-${Date.now()}`,
      complaint_id,
      user_id: user?.id || 'anon-citizen',
      author_name: authorMeta.author_name,
      author_badge: authorMeta.author_badge,
      is_official: authorMeta.is_official,
      content: sanitizedContent,
      created_at: new Date().toISOString(),
    };

    MEMORY_COMMENTS.push(newComment);

    // Try Supabase insert
    try {
      const supabase = createAdminClient();
      await supabase.from('comments').insert({
        complaint_id,
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        content: sanitizedContent,
        is_official: authorMeta.is_official,
      });
    } catch {
      // Memory fallback
    }

    return NextResponse.json({
      success: true,
      data: {
        comment: newComment,
      },
    });
  } catch (error) {
    console.error('[/api/community/comments POST error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to post community comment.' },
      { status: 500 }
    );
  }
}
