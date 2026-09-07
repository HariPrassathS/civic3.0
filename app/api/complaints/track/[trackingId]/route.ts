// =============================================================================
// CivicConnect TN — Public Track API Route (/api/complaints/track/[trackingId])
// =============================================================================
// Secure, privacy-safe complaint tracking lookup. Returns sanitized complaint
// data without exposing citizen personal information for unauthenticated lookups.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MEMORY_COMPLAINTS } from '@/lib/complaints/service';

// Rate limiting: simple in-memory window counter
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 lookups/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

// Clean old entries periodically (prevent memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60_000);

/**
 * Strip sensitive fields from complaint data for public tracking responses.
 */
function sanitizeForPublic(complaint: Record<string, unknown>): Record<string, unknown> {
  const {
    citizen_id: _citizenId,
    ai_category_confidence: _aiCat,
    ai_priority_confidence: _aiPri,
    ai_sentiment: _aiSent,
    ...safe
  } = complaint;
  return safe;
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await props.params;
    const cleanId = decodeURIComponent(trackingId).trim();

    // Validate tracking ID format (basic sanity check)
    if (!cleanId || cleanId.length < 3 || cleanId.length > 64) {
      return NextResponse.json(
        { success: false, error: 'Invalid Tracking ID format' },
        { status: 400 }
      );
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { success: false, error: 'Too many tracking requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // Optional: include timeline data
    const includeTimeline = request.nextUrl.searchParams.get('include') === 'timeline';

    // 1. Primary: Query Supabase Database
    try {
      const supabase = createAdminClient();
      if (supabase) {
        const query = supabase
          .from('complaints')
          .select(`
            id,
            tracking_id,
            category_id,
            department_id,
            status,
            priority,
            title,
            description,
            address,
            ward,
            district,
            source,
            language,
            is_public,
            sla_deadline,
            sla_breached,
            escalation_level,
            ai_category_confidence,
            ai_priority_confidence,
            ai_sentiment,
            resolved_at,
            closed_at,
            created_at,
            updated_at,
            category:categories(name, code),
            department:departments(name, code),
            media:complaint_media(id, media_type, url, storage_path, phase, ai_analysis, created_at),
            ai_insights:ai_insights(id, insight_type, result, confidence, model, created_at)${
              includeTimeline
                ? ',updates:complaint_updates(id, previous_status, new_status, update_type, notes, metadata, created_at)'
                : ''
            }
          `)
          .ilike('tracking_id', cleanId);

        const { data, error } = await query.maybeSingle();

        if (!error && data) {
          const complaintData = data as any;

          // Sort timeline updates chronologically
          if (Array.isArray(complaintData.updates)) {
            complaintData.updates.sort(
              (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          }

          // Fetch assigned worker from complaint_assignments
          try {
            const { data: assignData } = await (supabase
              .from('complaint_assignments')
              .select('assigned_to, worker:profiles!complaint_assignments_assigned_to_fkey(id, display_name, role, phone)')
              .eq('complaint_id', complaintData.id)
              .eq('is_active', true)
              .limit(1)
              .maybeSingle() as any);

            if (assignData?.worker) {
              const w: any = assignData.worker;
              complaintData.assigned_worker = {
                id: w.id,
                full_name: w.display_name,
                role: w.role,
                phone_number: w.phone,
              };
            }
          } catch {
            // Non-critical
          }

          // Generate signed URLs for any media files with storage paths in private bucket
          if (Array.isArray(complaintData.media) && complaintData.media.length > 0) {
            for (const item of complaintData.media) {
              // If url is already an external image (e.g. Unsplash or direct link), preserve it
              if (item.url && !item.url.includes('supabase.co')) {
                continue;
              }
              if (item.storage_path) {
                try {
                  const { data: signed, error: signErr } = await supabase.storage
                    .from('complaint-evidence')
                    .createSignedUrl(item.storage_path, 86400);
                  if (!signErr && signed?.signedUrl) {
                    item.url = signed.signedUrl;
                  }
                } catch {
                  // Fallback to existing url
                }
              }
            }
          }

          // Normalize ai_insights metadata shape for UI consumption
          if (Array.isArray(complaintData.ai_insights)) {
            complaintData.ai_insights = complaintData.ai_insights.map((insight: any) => ({
              ...insight,
              category_suggested: insight.result?.category || insight.category_suggested,
              priority_suggested: insight.result?.priority || insight.priority_suggested,
              severity_score: insight.result?.severity || insight.severity_score,
              reasoning: insight.result?.reasoning || insight.reasoning,
              metadata: {
                summary: insight.result?.english_summary || insight.result?.summary,
                tamil_summary: insight.result?.tamil_summary,
                severity: insight.result?.severity,
                urgency: insight.result?.urgency,
                public_impact: insight.result?.public_impact,
                department: insight.result?.department,
                ...insight.result,
              },
            }));
          }

          return NextResponse.json({
            success: true,
            data: {
              complaint: complaintData,
              source: 'database',
            },
          });
        }
      }
    } catch (err) {
      console.warn('[Tracking Supabase DB fallback warning]:', err);
    }

    // 2. Secondary fallback: in-memory store
    const memFound = MEMORY_COMPLAINTS.find(
      (c) => c.tracking_id.toLowerCase() === cleanId.toLowerCase() || c.id === cleanId
    );

    if (memFound) {
      const sanitized = sanitizeForPublic(memFound as unknown as Record<string, unknown>);
      return NextResponse.json({
        success: true,
        data: {
          complaint: sanitized,
          source: 'cache',
        },
      });
    }

    return NextResponse.json(
      { success: false, error: `No complaint found with Tracking ID "${cleanId}"` },
      { status: 404 }
    );
  } catch (error) {
    console.error('[/api/complaints/track error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search tracking ID' },
      { status: 500 }
    );
  }
}
