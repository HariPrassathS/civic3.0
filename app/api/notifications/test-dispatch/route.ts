// =============================================================================
// CivicConnect TN — Notification Event Test Dispatch API Route
// =============================================================================
// Allows triggering any of the 10 complaint lifecycle events for live testing.

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { NotificationHub } from '@/lib/notifications/service';
import { NotificationEventType } from '@/lib/notifications/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Production guard: test notifications should only be triggered by Admins in production
    if (process.env.NODE_ENV === 'production' && user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Test notification dispatch is restricted to Admins.' },
        { status: 403 }
      );
    }

    const userId = user?.id || 'dev-user-citizen';
    const body = await request.json();

    const {
      event_type,
      tracking_id = `CC-TN-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      title = 'Pothole & Drainage Damage at Usman Road',
      category_name = 'Roads & Infrastructure',
      department_name = 'Roads & Infrastructure',
      ward = 119,
      district = 'Chennai',
      priority = 'high',
      notes = 'Dispatched inspection crew.',
    } = body;

    const mockComplaint = {
      id: `cmp-test-${Date.now().toString(36)}`,
      tracking_id,
      title,
      citizen_id: userId,
      status: 'in_progress',
      priority,
      ward,
      district,
      category_name,
      department_name,
      sla_deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    };

    let result: any;

    switch (event_type) {
      case NotificationEventType.COMPLAINT_SUBMITTED:
        result = await NotificationHub.onComplaintSubmitted(mockComplaint);
        break;

      case NotificationEventType.ASSIGNED:
        result = await NotificationHub.onComplaintAssigned({
          complaint: mockComplaint,
          assigneeId: userId,
          assigneeName: 'GCC Road Maintenance Division',
          assignedByRole: 'area_officer',
          notes,
        });
        break;

      case NotificationEventType.STATUS_CHANGED:
        result = await NotificationHub.onStatusChanged({
          complaint: mockComplaint,
          previousStatus: 'created',
          newStatus: 'in_progress',
          actorRole: 'field_worker',
          notes,
        });
        break;

      case NotificationEventType.SLA_WARNING:
        result = await NotificationHub.onSlaApproaching({
          complaint: mockComplaint,
          recipientUserId: userId,
          hoursRemaining: 4,
        });
        break;

      case NotificationEventType.SLA_BREACHED:
        result = await NotificationHub.onSlaBreached({
          complaint: mockComplaint,
          recipientUserId: userId,
        });
        break;

      case NotificationEventType.ESCALATED:
        result = await NotificationHub.onComplaintEscalated({
          complaint: mockComplaint,
          escalatedToUserId: userId,
          escalationLevel: 2,
          escalatedToRole: 'District Collector',
          reason: 'SLA breached with 0 updates',
        });
        break;

      case NotificationEventType.RESOLVED:
        result = await NotificationHub.onComplaintResolved({
          complaint: mockComplaint,
          resolutionNotes: 'Asphalt paving completed and compacted.',
        });
        break;

      case NotificationEventType.REOPENED:
        result = await NotificationHub.onComplaintReopened({
          complaint: mockComplaint,
          recipientUserId: userId,
          reason: 'Pothole opened up again after rain.',
        });
        break;

      case NotificationEventType.VERIFIED:
        result = await NotificationHub.onComplaintVerified({
          complaint: mockComplaint,
          verificationResult: 'Verified & Approved',
          verifiedByRole: 'Area Quality Officer',
        });
        break;

      case NotificationEventType.CLOSED:
        result = await NotificationHub.onComplaintClosed(mockComplaint);
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported event type: ${event_type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Event "${event_type}" triggered successfully`,
      data: { result },
    });
  } catch (error: any) {
    console.error('[/api/notifications/test-dispatch POST error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch test notification' },
      { status: 500 }
    );
  }
}
