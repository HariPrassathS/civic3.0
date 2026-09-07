// =============================================================================
// CivicConnect TN — AI Complaint Triage API Route (/api/ai/triage)
// =============================================================================
// Performs instant AI triage: Categorization, Priority, Sentiment, Safety Risk, and Summary.
// Protected with rate limiting, PII masking, and strict input constraints.

import { NextResponse } from 'next/server';
import { GroqAiEngine } from '@/lib/ai/engine';
import { maskPii } from '@/lib/ai/client';
import { GlobalRateLimiter, getClientIp } from '@/lib/security/rate-limiter';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting: 30 requests / min per IP
    const clientIp = getClientIp(request);
    const rateLimit = GlobalRateLimiter.check(`ai_triage:${clientIp}`, {
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
    const { title, description } = body;

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

    const descStr = typeof description === 'string' ? description.trim() : '';
    if (descStr.length > 4000) {
      return NextResponse.json(
        { success: false, error: 'Complaint description must not exceed 4000 characters.' },
        { status: 400 }
      );
    }

    const cleanTitle = maskPii(title.trim());
    const cleanDesc = maskPii(descStr);

    const triageResult = await GroqAiEngine.runFullTriage(cleanTitle, cleanDesc);

    return NextResponse.json({
      success: true,
      data: triageResult,
    });
  } catch (error) {
    console.error('[/api/ai/triage POST error]:', error);
    return NextResponse.json(
      { success: false, error: 'AI triage processing failed.' },
      { status: 500 }
    );
  }
}
