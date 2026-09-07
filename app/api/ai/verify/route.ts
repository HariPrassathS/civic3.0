// =============================================================================
// CivicConnect TN — AI Resolution Verification API Route (/api/ai/verify)
// =============================================================================
// Analyzes before & after resolution media for quality and authenticity.
// Protected with rate limiting, PII masking, and strict input constraints.

import { NextResponse } from 'next/server';
import { GroqAiEngine } from '@/lib/ai/engine';
import { maskPii } from '@/lib/ai/client';
import { GlobalRateLimiter, getClientIp } from '@/lib/security/rate-limiter';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting: 30 requests / min per IP
    const clientIp = getClientIp(request);
    const rateLimit = GlobalRateLimiter.check(`ai_verify:${clientIp}`, {
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
    const { title, description, before_media_urls, after_media_urls, resolution_notes } = body;

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

    const verificationResult = await GroqAiEngine.verifyResolution(
      maskPii(title.trim()),
      maskPii(typeof description === 'string' ? description.trim() : ''),
      Array.isArray(before_media_urls) ? before_media_urls.slice(0, 10) : [],
      Array.isArray(after_media_urls) ? after_media_urls.slice(0, 10) : [],
      maskPii(typeof resolution_notes === 'string' ? resolution_notes.trim() : '')
    );

    return NextResponse.json({
      success: true,
      data: verificationResult,
    });
  } catch (error) {
    console.error('[/api/ai/verify POST error]:', error);
    return NextResponse.json(
      { success: false, error: 'Resolution verification failed.' },
      { status: 500 }
    );
  }
}
