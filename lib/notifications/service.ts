// =============================================================================
// CivicConnect TN — Notification Event Hub (All 10 Lifecycle Events)
// =============================================================================
// The single high-level API for triggering multi-channel notifications across
// all grievance state transitions, assignments, SLA alerts, and escalations.

import {
  DispatchNotificationResult,
  NotificationEventType,
} from './types';
import { dispatchNotification } from './dispatch';

export interface ComplaintNotificationContext {
  id: string;
  tracking_id: string;
  title: string;
  citizen_id: string;
  status: string;
  priority?: string | null;
  ward?: number | null;
  district?: string | null;
  category_name?: string | null;
  department_name?: string | null;
  sla_deadline?: string | null;
}

export const NotificationHub = {
  /**
   * 1. EVENT: Complaint Submitted
   */
  async onComplaintSubmitted(
    complaint: ComplaintNotificationContext,
    recipientEmail?: string,
    recipientPhone?: string
  ): Promise<DispatchNotificationResult> {
    return dispatchNotification({
      userId: complaint.citizen_id,
      complaintId: complaint.id,
      type: NotificationEventType.COMPLAINT_SUBMITTED,
      title: `Issue Registered: ${complaint.tracking_id}`,
      body: `Your grievance regarding "${complaint.title}" has been registered successfully. Tracking ID: ${complaint.tracking_id}.`,
      recipientEmail,
      recipientPhone,
      metadata: {
        tracking_id: complaint.tracking_id,
        category: complaint.category_name,
        department: complaint.department_name,
        priority: complaint.priority,
      },
    });
  },

  /**
   * 2. EVENT: Complaint Assigned
   */
  async onComplaintAssigned(params: {
    complaint: ComplaintNotificationContext;
    assigneeId: string;
    assigneeName?: string;
    assignedByRole?: string;
    notes?: string;
  }): Promise<{ citizenResult: DispatchNotificationResult; officerResult: DispatchNotificationResult }> {
    const { complaint, assigneeId, assigneeName, assignedByRole, notes } = params;

    // A. Notify Citizen
    const citizenResult = await dispatchNotification({
      userId: complaint.citizen_id,
      complaintId: complaint.id,
      type: NotificationEventType.ASSIGNED,
      title: `Issue Assigned to Field Team: ${complaint.tracking_id}`,
      body: `Your grievance "${complaint.title}" has been assigned to ${assigneeName || 'Municipal Field Operations'}.`,
      metadata: {
        tracking_id: complaint.tracking_id,
        assigned_to: assigneeName,
        assigned_by_role: assignedByRole,
      },
    });

    // B. Notify Assigned Officer / Field Worker
    const officerResult = await dispatchNotification({
      userId: assigneeId,
      complaintId: complaint.id,
      type: NotificationEventType.ASSIGNED,
      title: `New Task Assignment: ${complaint.tracking_id}`,
      body: `You have been assigned grievance "${complaint.title}" in Ward ${complaint.ward || 'General'}. Priority: ${complaint.priority || 'Medium'}. ${notes ? `Notes: ${notes}` : ''}`,
      metadata: {
        tracking_id: complaint.tracking_id,
        ward: complaint.ward,
        priority: complaint.priority,
        sla_deadline: complaint.sla_deadline,
      },
    });

    return { citizenResult, officerResult };
  },

  /**
   * 3. EVENT: Status Changed
   */
  async onStatusChanged(params: {
    complaint: ComplaintNotificationContext;
    previousStatus: string;
    newStatus: string;
    actorRole?: string;
    notes?: string;
  }): Promise<DispatchNotificationResult> {
    const { complaint, previousStatus, newStatus, actorRole, notes } = params;
    const formattedStatus = newStatus.replace(/_/g, ' ').toUpperCase();

    return dispatchNotification({
      userId: complaint.citizen_id,
      complaintId: complaint.id,
      type: NotificationEventType.STATUS_CHANGED,
      title: `Status Updated: ${complaint.tracking_id} is now ${formattedStatus}`,
      body: `Your complaint "${complaint.title}" transitioned from ${previousStatus} to ${newStatus}.${notes ? ` Update note: ${notes}` : ''}`,
      metadata: {
        tracking_id: complaint.tracking_id,
        previous_status: previousStatus,
        new_status: newStatus,
        actor_role: actorRole,
      },
    });
  },

  /**
   * 4. EVENT: SLA Approaching / Warning
   */
  async onSlaApproaching(params: {
    complaint: ComplaintNotificationContext;
    recipientUserId: string;
    hoursRemaining: number;
  }): Promise<DispatchNotificationResult> {
    const { complaint, recipientUserId, hoursRemaining } = params;

    return dispatchNotification({
      userId: recipientUserId,
      complaintId: complaint.id,
      type: NotificationEventType.SLA_WARNING,
      title: `⚠️ SLA Warning: ${complaint.tracking_id} (${hoursRemaining}h remaining)`,
      body: `Grievance "${complaint.title}" in Ward ${complaint.ward || 'General'} has ${hoursRemaining} hours remaining before SLA breach. Please expedite resolution.`,
      metadata: {
        tracking_id: complaint.tracking_id,
        hours_remaining: hoursRemaining,
        sla_deadline: complaint.sla_deadline,
      },
    });
  },

  /**
   * 5. EVENT: SLA Breached
   */
  async onSlaBreached(params: {
    complaint: ComplaintNotificationContext;
    recipientUserId: string;
  }): Promise<DispatchNotificationResult> {
    const { complaint, recipientUserId } = params;

    return dispatchNotification({
      userId: recipientUserId,
      complaintId: complaint.id,
      type: NotificationEventType.SLA_BREACHED,
      title: `🚨 SLA Breached: ${complaint.tracking_id}`,
      body: `Resolution deadline for grievance "${complaint.title}" was exceeded. Automated escalation pipeline triggered.`,
      metadata: {
        tracking_id: complaint.tracking_id,
        sla_deadline: complaint.sla_deadline,
        ward: complaint.ward,
      },
    });
  },

  /**
   * 6. EVENT: Complaint Escalated
   */
  async onComplaintEscalated(params: {
    complaint: ComplaintNotificationContext;
    escalatedToUserId: string;
    escalationLevel: number;
    escalatedToRole: string;
    reason?: string;
  }): Promise<DispatchNotificationResult> {
    const { complaint, escalatedToUserId, escalationLevel, escalatedToRole, reason } = params;

    return dispatchNotification({
      userId: escalatedToUserId,
      complaintId: complaint.id,
      type: NotificationEventType.ESCALATED,
      title: `🔺 Escalation Level ${escalationLevel}: ${complaint.tracking_id}`,
      body: `Grievance "${complaint.title}" in ${complaint.district} has been escalated to ${escalatedToRole}. ${reason ? `Reason: ${reason}` : ''}`,
      metadata: {
        tracking_id: complaint.tracking_id,
        escalation_level: escalationLevel,
        escalated_to_role: escalatedToRole,
        reason,
      },
    });
  },

  /**
   * 7. EVENT: Complaint Resolved
   */
  async onComplaintResolved(params: {
    complaint: ComplaintNotificationContext;
    resolutionNotes?: string;
  }): Promise<DispatchNotificationResult> {
    const { complaint, resolutionNotes } = params;

    return dispatchNotification({
      userId: complaint.citizen_id,
      complaintId: complaint.id,
      type: NotificationEventType.RESOLVED,
      title: `Fix Submitted / Resolved: ${complaint.tracking_id}`,
      body: `Field staff completed work on "${complaint.title}". Please verify the resolution and rate the service quality.`,
      metadata: {
        tracking_id: complaint.tracking_id,
        resolution_notes: resolutionNotes,
      },
    });
  },

  /**
   * 8. EVENT: Complaint Reopened
   */
  async onComplaintReopened(params: {
    complaint: ComplaintNotificationContext;
    recipientUserId: string;
    reason?: string;
  }): Promise<DispatchNotificationResult> {
    const { complaint, recipientUserId, reason } = params;

    return dispatchNotification({
      userId: recipientUserId,
      complaintId: complaint.id,
      type: NotificationEventType.REOPENED,
      title: `🔄 Issue Reopened by Citizen: ${complaint.tracking_id}`,
      body: `Citizen reopened grievance "${complaint.title}". ${reason ? `Feedback reason: ${reason}` : 'Further remediation required.'}`,
      metadata: {
        tracking_id: complaint.tracking_id,
        reason,
      },
    });
  },

  /**
   * 9. EVENT: Complaint Verified
   */
  async onComplaintVerified(params: {
    complaint: ComplaintNotificationContext;
    verificationResult: string;
    verifiedByRole?: string;
  }): Promise<DispatchNotificationResult> {
    const { complaint, verificationResult, verifiedByRole } = params;

    return dispatchNotification({
      userId: complaint.citizen_id,
      complaintId: complaint.id,
      type: NotificationEventType.VERIFIED,
      title: `Quality Verified: ${complaint.tracking_id}`,
      body: `The resolution for "${complaint.title}" has been audited and verified as ${verificationResult} by ${verifiedByRole || 'Area Quality Officer'}.`,
      metadata: {
        tracking_id: complaint.tracking_id,
        verification_result: verificationResult,
      },
    });
  },

  /**
   * 10. EVENT: Complaint Closed
   */
  async onComplaintClosed(
    complaint: ComplaintNotificationContext
  ): Promise<DispatchNotificationResult> {
    return dispatchNotification({
      userId: complaint.citizen_id,
      complaintId: complaint.id,
      type: NotificationEventType.CLOSED,
      title: `Case Closed: ${complaint.tracking_id}`,
      body: `Your grievance case "${complaint.title}" has been successfully closed. Thank you for making Tamil Nadu better.`,
      metadata: {
        tracking_id: complaint.tracking_id,
      },
    });
  },
};
