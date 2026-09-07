// =============================================================================
// CivicConnect TN — Area Officer Verification Decision API (/api/evidence/officer-decision)
// =============================================================================

import { NextResponse } from 'next/server';
import { ComplaintEngine } from '@/lib/complaints/engine';
import { ComplaintStatus, UserRole } from '@/types/enums';
import { createAdminClient } from '@/lib/supabase/admin';
import { GlobalRateLimiter, getClientIp } from '@/lib/security/rate-limiter';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = GlobalRateLimiter.check(`officer_decision:${clientIp}`, {
      windowMs: 60 * 1000,
      maxRequests: 40,
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
    const { complaint_id, decision, notes, officer_id, officer_name, override_reason } = body;

    if (!complaint_id) {
      return NextResponse.json(
        { success: false, error: 'complaint_id is required.' },
        { status: 400 }
      );
    }

    const validDecisions = ['APPROVE', 'REJECT_REWORK', 'REQUEST_NEW_EVIDENCE'];
    if (!validDecisions.includes(decision)) {
      return NextResponse.json(
        { success: false, error: `Invalid decision '${decision}'. Allowed: ${validDecisions.join(', ')}` },
        { status: 400 }
      );
    }

    const actor = {
      id: officer_id || 'officer-ae-chennai-114',
      role: UserRole.AREA_OFFICER,
      displayName: officer_name || 'Assistant Engineer (AE)',
      email: 'officer.ae@tn.gov.in',
    };

    let targetStatus: ComplaintStatus;
    let auditAction: string;
    let updateNotes: string;

    if (decision === 'APPROVE') {
      targetStatus = ComplaintStatus.RESOLVED;
      auditAction = 'OFFICER_VERIFICATION_APPROVED';
      updateNotes = notes || 'Verified on-site by Area Officer. Resolution evidence meets municipal quality standards.';
    } else if (decision === 'REJECT_REWORK') {
      targetStatus = ComplaintStatus.IN_PROGRESS;
      auditAction = 'OFFICER_VERIFICATION_REJECTED';
      updateNotes = `Rework Required: ${notes || 'Resolution proof rejected by Area Officer. Further work needed.'}`;
    } else {
      targetStatus = ComplaintStatus.IN_PROGRESS;
      auditAction = 'NEW_EVIDENCE_REQUESTED';
      updateNotes = `Additional Evidence Requested: ${notes || 'Officer requested clearer resolution proof from field team.'}`;
    }

    const transitionRes = await ComplaintEngine.transitionStatus({
      actor,
      complaintId: complaint_id,
      newStatus: targetStatus,
      notes: updateNotes,
      metadata: {
        decision,
        override_reason: override_reason || null,
        decided_at: new Date().toISOString(),
      },
      ipAddress: clientIp,
    });

    // Audit log entry
    try {
      const supabase = createAdminClient();
      if (supabase) {
        await supabase.from('audit_logs').insert({
          action: auditAction,
          entity_type: 'complaints',
          entity_id: complaint_id,
          actor_id: actor.id,
          new_value: {
            decision,
            notes: updateNotes,
            override: Boolean(override_reason),
            override_reason,
          },
          ip_address: clientIp || '127.0.0.1',
        });
      }
    } catch (auditErr) {
      console.warn('[Officer Decision Audit Warn]:', auditErr);
    }

    return NextResponse.json({
      success: transitionRes.success,
      data: {
        complaint_id,
        decision,
        new_status: targetStatus,
        notes: updateNotes,
      },
      errors: transitionRes.errors,
    });
  } catch (error) {
    console.error('[/api/evidence/officer-decision POST error]:', error);
    return NextResponse.json(
      { success: false, error: 'Officer verification decision processing failed.' },
      { status: 500 }
    );
  }
}
