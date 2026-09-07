// =============================================================================
// CivicConnect TN — Resolution Feedback API Route (/api/complaints/[id]/feedback)
// =============================================================================

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { ComplaintEngine } from '@/lib/complaints/engine';
import { UserRole } from '@/types/enums';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await props.params;
    const body = await request.json();
    const { rating, feedback, satisfied } = body;

    const actor = {
      id: user?.id || 'dev-user-citizen',
      role: user?.role || UserRole.CITIZEN,
      email: user?.email,
      display_name: user?.display_name,
    };

    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';

    const result = await ComplaintEngine.submitCitizenFeedback({
      complaintId: id,
      actor,
      rating: Number(rating),
      feedback,
      satisfied: Boolean(satisfied),
      ipAddress: clientIp,
    });

    if (!result.success) {
      const isAuthError = result.errors?.some((e) => e.toLowerCase().includes('unauthorized'));
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Feedback submission failed',
          errors: result.errors,
        },
        { status: isAuthError ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: { complaint: result.complaint },
    });
  } catch (error) {
    console.error('[/api/complaints/[id]/feedback error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}
