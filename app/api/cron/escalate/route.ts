// =============================================================================
// CivicConnect TN — Protected SLA Escalation Cron Route (/api/cron/escalate)
// =============================================================================
// Scheduled cron execution endpoint for automated 8-level statutory escalations.
// Protected by CRON_SECRET or administrative session auth.
// Idempotent: safe against concurrent execution and duplicate breach processing.

import { NextResponse } from 'next/server';
import { processSlaBreaches } from '@/lib/sla/escalation';
import { getCurrentUser } from '@/lib/auth/server';
import { UserRole } from '@/types/enums';

function isAuthorized(request: Request, userRole?: UserRole): boolean {
  // 1. Allow if Admin user is signed in
  if (userRole === UserRole.ADMIN) {
    return true;
  }

  // 2. Check Authorization Header Bearer token / custom header / query param
  const authHeader = request.headers.get('authorization');
  const customHeader = request.headers.get('x-cron-secret');
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key');

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && process.env.NODE_ENV === 'production') {
    // In production, CRON_SECRET is strictly required when not authenticated as admin
    return false;
  }

  const effectiveSecret = cronSecret || 'civic_tn_cron_secret_2026';

  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token && token === effectiveSecret) return true;
  }

  if (customHeader && customHeader === effectiveSecret) {
    return true;
  }

  if (queryKey && queryKey === effectiveSecret) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!isAuthorized(request, currentUser?.role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Valid CRON_SECRET or Admin session required.',
        },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    const result = await processSlaBreaches({ limit });

    return NextResponse.json({
      success: true,
      message: `SLA escalation sweep complete: ${result.escalated} escalated, ${result.skipped} skipped, ${result.scanned} total scanned.`,
      data: result,
    });
  } catch (error) {
    console.error('[/api/cron/escalate GET error]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during escalation sweep' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!isAuthorized(request, currentUser?.role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Valid CRON_SECRET or Admin session required.',
        },
        { status: 401 }
      );
    }

    let body: { reference_time?: string; limit?: number; debounce_minutes?: number } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const refTime = body.reference_time ? new Date(body.reference_time) : new Date();
    const result = await processSlaBreaches({
      referenceTime: refTime,
      limit: body.limit || 100,
      debounceMinutes: body.debounce_minutes || 10,
    });

    return NextResponse.json({
      success: true,
      message: `SLA escalation sweep complete: ${result.escalated} escalated, ${result.skipped} skipped, ${result.scanned} total scanned.`,
      data: result,
    });
  } catch (error) {
    console.error('[/api/cron/escalate POST error]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during escalation sweep' },
      { status: 500 }
    );
  }
}
