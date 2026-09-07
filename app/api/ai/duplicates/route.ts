// =============================================================================
// CivicConnect TN — AI Duplicate Detection API Route (/api/ai/duplicates)
// =============================================================================
// Identifies duplicate civic complaints across municipal jurisdiction.
// Protected with rate limiting, PII masking, and strict input constraints.

import { NextResponse } from 'next/server';
import { GroqAiEngine } from '@/lib/ai/engine';
import { maskPii } from '@/lib/ai/client';
import { MEMORY_COMPLAINTS } from '@/lib/complaints/service';
import { createAdminClient } from '@/lib/supabase/admin';
import { GlobalRateLimiter, getClientIp } from '@/lib/security/rate-limiter';
import type { Complaint } from '@/types/database';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting: 30 requests / min per IP
    const clientIp = getClientIp(request);
    const rateLimit = GlobalRateLimiter.check(`ai_duplicates:${clientIp}`, {
      windowMs: 60 * 1000,
      maxRequests: 30,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `AI request rate limit exceeded. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { title, description, ward, district } = body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Complaint title is required (min 3 characters).' },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Complaint title must not exceed 200 characters.' },
        { status: 400 }
      );
    }

    let candidates: Complaint[] = [];

    // Query active candidates from Supabase or Memory
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createAdminClient();
        let query = supabase
          .from('complaints')
          .select('*')
          .not('status', 'in', '("closed","resolved","rejected")')
          .limit(20);

        if (ward) query = query.eq('ward', Number(ward));
        if (district) query = query.eq('district', String(district));

        const { data, error } = await query;
        if (!error && data) candidates = data as Complaint[];
      }
    } catch {
      // Fallback
    }

    if (candidates.length === 0) {
      candidates = MEMORY_COMPLAINTS.filter((c) => c.status !== 'closed' && c.status !== 'resolved');
    }

    const duplicateResult = await GroqAiEngine.detectDuplicates(
      maskPii(title.trim()),
      maskPii(typeof description === 'string' ? description.trim() : ''),
      candidates
    );

    return NextResponse.json({
      success: true,
      data: duplicateResult,
    });
  } catch (error) {
    console.error('[/api/ai/duplicates POST error]:', error);
    return NextResponse.json(
      { success: false, error: 'Duplicate detection failed.' },
      { status: 500 }
    );
  }
}
