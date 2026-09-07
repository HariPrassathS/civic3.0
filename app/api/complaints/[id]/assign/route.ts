// =============================================================================
// CivicConnect TN — Complaint Assignment API Route (/api/complaints/[id]/assign)
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

    const { assigned_to, notes, role_at_assignment } = body;

    if (!assigned_to) {
      return NextResponse.json(
        { success: false, error: 'Recipient user ID (assigned_to) is required' },
        { status: 400 }
      );
    }

    const assignedBy = {
      id: user?.id || 'dev-user-officer',
      role: user?.role || UserRole.AREA_OFFICER,
      email: user?.email,
      display_name: user?.display_name,
    };

    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';

    const result = await ComplaintEngine.assignComplaint({
      complaintId: id,
      assignedTo: assigned_to,
      assignedBy,
      roleAtAssignment: role_at_assignment || 'field_worker',
      notes,
      ipAddress: clientIp,
    });

    if (!result.success) {
      const isAuthError = result.errors?.some((e) => e.toLowerCase().includes('not authorized'));
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Assignment failed',
          errors: result.errors,
        },
        { status: isAuthError ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        complaint: result.complaint,
        assignment: result.assignment,
      },
    });
  } catch (error) {
    console.error('[/api/complaints/[id]/assign POST error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign complaint' },
      { status: 500 }
    );
  }
}
