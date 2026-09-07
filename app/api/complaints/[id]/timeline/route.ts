// =============================================================================
// CivicConnect TN — Complaint Timeline & Audit API Route (/api/complaints/[id]/timeline)
// =============================================================================

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { ComplaintEngine } from '@/lib/complaints/engine';
import { UserRole } from '@/types/enums';

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await props.params;

    const actor = {
      id: user?.id || 'anonymous',
      role: user?.role || UserRole.CITIZEN,
      email: user?.email,
      display_name: user?.display_name,
    };

    const complaint = await ComplaintEngine.getComplaintById(id);
    if (!complaint) {
      return NextResponse.json(
        { success: false, error: 'Complaint not found' },
        { status: 404 }
      );
    }

    const timeline = await ComplaintEngine.getComplaintTimeline(complaint.id);
    const auditLogs = await ComplaintEngine.getAuditHistory(complaint.id, actor);

    return NextResponse.json({
      success: true,
      data: {
        complaint_id: complaint.id,
        tracking_id: complaint.tracking_id,
        current_status: complaint.status,
        timeline,
        audit_logs: auditLogs,
      },
    });
  } catch (error) {
    console.error('[/api/complaints/[id]/timeline GET error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch complaint timeline' },
      { status: 500 }
    );
  }
}
