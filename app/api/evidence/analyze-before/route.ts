// =============================================================================
// CivicConnect TN — Citizen Before Evidence Analysis API (/api/evidence/analyze-before)
// =============================================================================

import { NextResponse } from 'next/server';
import { EvidenceEngine } from '@/lib/evidence/evidence-engine';
import { createAdminClient } from '@/lib/supabase/admin';
import { GlobalRateLimiter, getClientIp } from '@/lib/security/rate-limiter';
import { safeLog } from '@/lib/ai/client';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = GlobalRateLimiter.check(`ev_before:${clientIp}`, {
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
      media_url,
      title,
      description,
      voice_transcript,
      category,
      address,
      latitude,
      longitude,
    } = body;

    if (!media_url || typeof media_url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'media_url is required.' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Complaint title is required.' },
        { status: 400 }
      );
    }

    const analysis = await EvidenceEngine.analyzeCitizenEvidence({
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      voiceTranscript: typeof voice_transcript === 'string' ? voice_transcript.trim() : undefined,
      category: typeof category === 'string' ? category.trim() : undefined,
      address: typeof address === 'string' ? address.trim() : undefined,
      latitude: typeof latitude === 'number' ? latitude : null,
      longitude: typeof longitude === 'number' ? longitude : null,
      mediaUrl: media_url.trim(),
    });

    // Update complaint_media in Supabase if complaint_id is provided
    if (complaint_id) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          await supabase
            .from('complaint_media')
            .update({ ai_analysis: analysis as any })
            .eq('complaint_id', complaint_id)
            .eq('url', media_url);

          await supabase.from('audit_logs').insert({
            action: 'AI_BEFORE_ANALYSIS_COMPLETED',
            entity_type: 'complaint_media',
            entity_id: complaint_id,
            new_value: { status: analysis.evidence_status, confidence: analysis.confidence },
            ip_address: clientIp || '127.0.0.1',
          });
        }
      } catch (dbErr) {
        safeLog('warn', 'Failed to persist before AI analysis to database', { error: String(dbErr) });
      }
    }

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('[/api/evidence/analyze-before POST error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze before evidence.' },
      { status: 500 }
    );
  }
}
