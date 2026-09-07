// =============================================================================
// CivicConnect TN — Field Worker After Resolution Evidence Analysis API (/api/evidence/analyze-after)
// =============================================================================

import { NextResponse } from 'next/server';
import { EvidenceEngine } from '@/lib/evidence/evidence-engine';
import { createAdminClient } from '@/lib/supabase/admin';
import { GlobalRateLimiter, getClientIp } from '@/lib/security/rate-limiter';
import { safeLog } from '@/lib/ai/client';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = GlobalRateLimiter.check(`ev_after:${clientIp}`, {
      windowMs: 60 * 1000,
      maxRequests: 30,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Please retry in ${rateLimit.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      complaint_id,
      before_media_url,
      after_media_url,
      title,
      description,
      category,
      resolution_notes,
      complaint_latitude,
      complaint_longitude,
      worker_latitude,
      worker_longitude,
    } = body;

    if (!after_media_url || typeof after_media_url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'after_media_url is required.' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Complaint title is required.' },
        { status: 400 }
      );
    }

    const analysis = await EvidenceEngine.analyzeResolutionEvidence({
      beforeMediaUrl: typeof before_media_url === 'string' ? before_media_url : undefined,
      afterMediaUrl: after_media_url.trim(),
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      category: typeof category === 'string' ? category.trim() : undefined,
      resolutionNotes: typeof resolution_notes === 'string' ? resolution_notes.trim() : 'Work completed by field team.',
      complaintLatitude: typeof complaint_latitude === 'number' ? complaint_latitude : null,
      complaintLongitude: typeof complaint_longitude === 'number' ? complaint_longitude : null,
      workerLatitude: typeof worker_latitude === 'number' ? worker_latitude : null,
      workerLongitude: typeof worker_longitude === 'number' ? worker_longitude : null,
    });

    // Update complaint_media in Supabase
    if (complaint_id) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          await supabase
            .from('complaint_media')
            .update({ ai_analysis: analysis as any })
            .eq('complaint_id', complaint_id)
            .eq('url', after_media_url);

          await supabase.from('audit_logs').insert({
            action: 'AI_AFTER_ANALYSIS_COMPLETED',
            entity_type: 'complaint_media',
            entity_id: complaint_id,
            new_value: {
              status: analysis.resolution_status,
              confidence: analysis.confidence,
              improvement: analysis.visual_improvement,
            },
            ip_address: clientIp || '127.0.0.1',
          });
        }
      } catch (dbErr) {
        safeLog('warn', 'Failed to persist after AI analysis to database', { error: String(dbErr) });
      }
    }

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('[/api/evidence/analyze-after POST error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze after resolution evidence.' },
      { status: 500 }
    );
  }
}
