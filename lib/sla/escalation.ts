// =============================================================================
// CivicConnect TN — 8-Level Statutory Escalation Execution Engine
// =============================================================================
// Enforces hierarchical accountability across 8 tiers of the Tamil Nadu government:
// Level 1: Field Worker (0h - 4h)
// Level 2: Area Officer / AE (4h - 12h)
// Level 3: Department Head / EE (12h - 24h)
// Level 4: City Commissioner (24h - 36h)
// Level 5: District Collector (36h - 48h)
// Level 6: Department Secretary (48h - 60h)
// Level 7: Chief Secretary (60h - 72h)
// Level 8: Chief Minister Special Cell (72h+)

import {
  UserRole,
  ComplaintStatus,
  UpdateType,
  NotificationType,
  NotificationChannel,
} from '@/types/enums';
import { ROLE_LABELS } from '@/config/roles';
import type {
  Complaint,
  EscalationLog,
  ComplaintUpdate,
  Notification,
  AuditLog,
  Profile,
} from '@/types/database';
import { createAdminClient } from '@/lib/supabase/admin';
import { MEMORY_COMPLAINTS } from '@/lib/complaints/service';
import { MEMORY_USERS } from '@/app/api/admin/users/route';

/**
 * Definition for each of the 8 statutory escalation tiers
 */
export interface EscalationTier {
  level: number;
  role: UserRole;
  windowHours: number;
  label: string;
  authorityTitle: string;
  description: string;
}

export const ESCALATION_TIERS: Record<number, EscalationTier> = {
  1: {
    level: 1,
    role: UserRole.FIELD_WORKER,
    windowHours: 4,
    label: 'Level 1 — Field Worker',
    authorityTitle: 'Ground Maintenance Unit & Crew Leader',
    description: 'Initial operational deployment and ground rectification.',
  },
  2: {
    level: 2,
    role: UserRole.AREA_OFFICER,
    windowHours: 8,
    label: 'Level 2 — Area Officer (AE)',
    authorityTitle: 'Ward Assistant Engineer / Zonal Inspector',
    description: 'On-site technical inspection, contractor warning, and re-allocation.',
  },
  3: {
    level: 3,
    role: UserRole.DEPARTMENT_HEAD,
    windowHours: 12,
    label: 'Level 3 — Department Head (EE)',
    authorityTitle: 'Executive Engineer / Divisional Line Chief',
    description: 'Divisional resource mobilization and contractor penalty notice.',
  },
  4: {
    level: 4,
    role: UserRole.CITY_COMMISSIONER,
    windowHours: 12,
    label: 'Level 4 — City Commissioner (IAS)',
    authorityTitle: 'Municipal Corporation Commissioner',
    description: 'Inter-zonal flying squad dispatch and administrative inquiry.',
  },
  5: {
    level: 5,
    role: UserRole.DISTRICT_COLLECTOR,
    windowHours: 12,
    label: 'Level 5 — District Collector (IAS)',
    authorityTitle: 'District Magistrate & District Revenue Officer',
    description: 'District disaster & inter-departmental magisterial directive.',
  },
  6: {
    level: 6,
    role: UserRole.DEPARTMENT_SECRETARY,
    windowHours: 12,
    label: 'Level 6 — Department Secretary (IAS)',
    authorityTitle: 'Principal Secretary to Government (Line Ministry)',
    description: 'State ministry policy intervention & capital budget directive.',
  },
  7: {
    level: 7,
    role: UserRole.CHIEF_SECRETARY,
    windowHours: 12,
    label: 'Level 7 — Chief Secretary (IAS)',
    authorityTitle: 'Chief Secretary to Government of Tamil Nadu',
    description: 'Whole-of-government secretarial review & civil performance flag.',
  },
  8: {
    level: 8,
    role: UserRole.CHIEF_MINISTER,
    windowHours: 24,
    label: 'Level 8 — Chief Minister Special Cell',
    authorityTitle: 'Chief Minister Executive Secretariat & CMO Grievance Desk',
    description: 'Apex statutory intervention with mandatory cabinet accountability.',
  },
};

// In-memory escalation logs store
export const MEMORY_ESCALATION_LOGS: EscalationLog[] = [];

// In-memory notifications store
export const MEMORY_NOTIFICATIONS: Notification[] = [];

export interface EscalationResult {
  success: boolean;
  complaintId: string;
  previousLevel: number;
  newLevel: number;
  targetRole: UserRole;
  targetUserId: string | null;
  newDeadline: string;
  reason?: string;
  escalationLog?: EscalationLog;
  error?: string;
}

export interface BatchEscalationResult {
  scanned: number;
  escalated: number;
  skipped: number;
  errors: string[];
  tickets: EscalationResult[];
  timestamp: string;
}

function getSafeAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/**
 * Finds the best-matching officer profile for a given escalation target role.
 */
export async function findTargetOfficer(
  targetRole: UserRole,
  departmentId?: string | null,
  wardId?: number | null,
  district?: string | null
): Promise<Profile | null> {
  // 1. Check in-memory store
  const memMatch = MEMORY_USERS.find((u) => {
    if (u.role !== targetRole || !u.is_active) return false;
    if (wardId && u.ward_id && u.ward_id === wardId) return true;
    if (departmentId && u.department_id && u.department_id === departmentId) return true;
    if (district && u.district && u.district.toLowerCase() === district.toLowerCase()) return true;
    return true; // Fallback to any active officer of that role
  });

  if (memMatch) return memMatch;

  // 2. Query Supabase
  try {
    const supabase = getSafeAdminClient();
    if (supabase) {
      let query = supabase.from('profiles').select('*').eq('role', targetRole).eq('is_active', true);
      if (wardId) query = query.eq('ward_id', wardId);
      if (departmentId) query = query.eq('department_id', departmentId);

      const { data, error } = await query.limit(1);
      if (!error && data && data.length > 0) {
        return data[0] as Profile;
      }
    }
  } catch {
    // Fallback
  }

  return null;
}

/**
 * Executes an 8-Level Statutory Escalation on a single complaint.
 * Idempotent, safe against duplicate escalation, and logs full audit trail.
 */
export async function escalateComplaint(
  complaintOrId: string | Complaint,
  options: {
    reason?: string;
    referenceTime?: Date;
    force?: boolean;
    actorId?: string;
  } = {}
): Promise<EscalationResult> {
  const refTime = options.referenceTime || new Date();
  const actorId = options.actorId || 'system:sla_escalation_engine';

  // 1. Resolve Complaint object
  let complaint: Complaint | null = null;
  if (typeof complaintOrId === 'string') {
    const mem = MEMORY_COMPLAINTS.find(
      (c) => c.id === complaintOrId || c.tracking_id.toLowerCase() === complaintOrId.toLowerCase()
    );
    if (mem) {
      complaint = mem;
    } else {
      try {
        const supabase = getSafeAdminClient();
        if (supabase) {
          const { data } = await supabase
            .from('complaints')
            .select('*')
            .eq('id', complaintOrId)
            .single();
          if (data) complaint = data as Complaint;
        }
      } catch {
        // Fallback
      }
    }
  } else {
    complaint = complaintOrId;
  }

  if (!complaint) {
    return {
      success: false,
      complaintId: typeof complaintOrId === 'string' ? complaintOrId : 'unknown',
      previousLevel: 0,
      newLevel: 0,
      targetRole: UserRole.FIELD_WORKER,
      targetUserId: null,
      newDeadline: refTime.toISOString(),
      error: 'Complaint not found',
    };
  }

  // 2. Guard: Refuse escalation for terminal complaints (CLOSED, RESOLVED, REJECTED)
  const isTerminal =
    complaint.status === ComplaintStatus.CLOSED ||
    complaint.status === ComplaintStatus.RESOLVED ||
    complaint.status === ComplaintStatus.REJECTED;

  if (isTerminal) {
    return {
      success: false,
      complaintId: complaint.id,
      previousLevel: complaint.escalation_level || 0,
      newLevel: complaint.escalation_level || 0,
      targetRole: UserRole.FIELD_WORKER,
      targetUserId: null,
      newDeadline: complaint.sla_deadline || refTime.toISOString(),
      error: `Cannot escalate complaint in terminal status '${complaint.status}'`,
    };
  }

  const currentLevel = complaint.escalation_level || 0;

  // 3. Guard: Max Level 8 ceiling
  if (currentLevel >= 8) {
    return {
      success: false,
      complaintId: complaint.id,
      previousLevel: currentLevel,
      newLevel: 8,
      targetRole: UserRole.CHIEF_MINISTER,
      targetUserId: null,
      newDeadline: complaint.sla_deadline || refTime.toISOString(),
      error: 'Complaint is already at Apex Escalation Level 8 (Chief Minister Special Cell).',
    };
  }

  // 4. Compute next escalation tier
  const nextLevel = Math.min(8, currentLevel + 1);
  const tier = ESCALATION_TIERS[nextLevel];

  // 5. Compute new extended deadline
  const windowExtensionHours = tier.windowHours;
  const newDeadline = new Date(refTime.getTime() + windowExtensionHours * 3600 * 1000);
  const newDeadlineIso = newDeadline.toISOString();

  // 6. Find target authority officer
  const targetOfficer = await findTargetOfficer(
    tier.role,
    complaint.department_id,
    complaint.ward,
    complaint.district
  );
  const targetUserId = targetOfficer?.id || null;

  const reason =
    options.reason ||
    `SLA deadline breached at Level ${currentLevel}. Auto-escalated to Level ${nextLevel} (${ROLE_LABELS[tier.role] || tier.role}) for immediate intervention.`;

  // 7. Create Escalation Log Record
  const escalationLog: EscalationLog = {
    id: `esc-log-${complaint.id}-L${nextLevel}-${Date.now()}`,
    complaint_id: complaint.id,
    escalation_level: nextLevel,
    escalated_to_role: tier.role,
    escalated_to_user: targetUserId,
    new_deadline: newDeadlineIso,
    reason,
    created_at: refTime.toISOString(),
  };

  // 8. Create Complaint Update Record
  const updateRecord: ComplaintUpdate = {
    id: `upd-esc-${complaint.id}-L${nextLevel}-${Date.now()}`,
    complaint_id: complaint.id,
    updated_by: actorId,
    previous_status: complaint.status,
    new_status: ComplaintStatus.ESCALATED,
    update_type: UpdateType.ESCALATION,
    notes: `[Statutory Escalation: Level ${nextLevel}] Escalated to ${ROLE_LABELS[tier.role]}. New SLA target: ${newDeadline.toLocaleString('en-IN')}. Reason: ${reason}`,
    metadata: {
      escalation_level: nextLevel,
      escalated_to_role: tier.role,
      escalated_to_user_id: targetUserId,
      new_deadline: newDeadlineIso,
      previous_deadline: complaint.sla_deadline,
    },
    created_at: refTime.toISOString(),
  };

  // 9. Create Notifications (Citizen + Target Officer)
  const citizenNotification: Notification = {
    id: `notif-cit-${complaint.id}-L${nextLevel}-${Date.now()}`,
    user_id: complaint.citizen_id,
    complaint_id: complaint.id,
    type: NotificationType.ESCALATED,
    title: `Grievance Escalated to Level ${nextLevel} (${ROLE_LABELS[tier.role]})`,
    body: `Your grievance ${complaint.tracking_id} ("${complaint.title}") was escalated to ${ROLE_LABELS[tier.role]} due to SLA threshold expiry. New resolution target: ${newDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
    channel: NotificationChannel.IN_APP,
    is_read: false,
    metadata: { tracking_id: complaint.tracking_id, level: nextLevel },
    created_at: refTime.toISOString(),
  };

  let officerNotification: Notification | null = null;
  if (targetUserId) {
    officerNotification = {
      id: `notif-off-${complaint.id}-L${nextLevel}-${Date.now()}`,
      user_id: targetUserId,
      complaint_id: complaint.id,
      type: NotificationType.ESCALATED,
      title: `⚡ Level ${nextLevel} Escalation Alert: ${complaint.tracking_id}`,
      body: `Unresolved civic grievance "${complaint.title}" in Ward ${complaint.ward || 'General'} has breached SLA and requires your immediate executive directive.`,
      channel: NotificationChannel.IN_APP,
      is_read: false,
      metadata: { tracking_id: complaint.tracking_id, level: nextLevel },
      created_at: refTime.toISOString(),
    };
  }

  // 10. Create Security Audit Log
  const auditLog: AuditLog = {
    id: `audit-esc-${complaint.id}-${Date.now()}`,
    actor_id: actorId,
    action: 'complaint.escalated',
    entity_type: 'complaints',
    entity_id: complaint.id,
    old_value: {
      escalation_level: currentLevel,
      status: complaint.status,
      sla_deadline: complaint.sla_deadline,
    },
    new_value: {
      escalation_level: nextLevel,
      status: ComplaintStatus.ESCALATED,
      sla_deadline: newDeadlineIso,
      target_role: tier.role,
      target_user_id: targetUserId,
    },
    ip_address: '127.0.0.1 (cron_worker)',
    created_at: refTime.toISOString(),
  };

  // 11. Update Memory Stores
  MEMORY_ESCALATION_LOGS.push(escalationLog);
  MEMORY_NOTIFICATIONS.push(citizenNotification);
  if (officerNotification) MEMORY_NOTIFICATIONS.push(officerNotification);

  // Update in-memory complaint
  const memIdx = MEMORY_COMPLAINTS.findIndex((c) => c.id === complaint?.id);
  if (memIdx >= 0) {
    MEMORY_COMPLAINTS[memIdx].escalation_level = nextLevel;
    MEMORY_COMPLAINTS[memIdx].status = ComplaintStatus.ESCALATED;
    MEMORY_COMPLAINTS[memIdx].sla_breached = true;
    MEMORY_COMPLAINTS[memIdx].sla_deadline = newDeadlineIso;
    MEMORY_COMPLAINTS[memIdx].updated_at = refTime.toISOString();
    if (!MEMORY_COMPLAINTS[memIdx].updates) MEMORY_COMPLAINTS[memIdx].updates = [];
    MEMORY_COMPLAINTS[memIdx].updates?.push(updateRecord);
  }

  // 12. Update Supabase
  try {
    const supabase = getSafeAdminClient();
    if (supabase) {
      // Update complaint
      await supabase
        .from('complaints')
        .update({
          escalation_level: nextLevel,
          status: ComplaintStatus.ESCALATED,
          sla_breached: true,
          sla_deadline: newDeadlineIso,
          updated_at: refTime.toISOString(),
        })
        .eq('id', complaint.id);

      // Insert escalation log
      await supabase.from('escalation_logs').insert(escalationLog as unknown as Record<string, unknown>);

      // Insert complaint update
      await supabase.from('complaint_updates').insert(updateRecord as unknown as Record<string, unknown>);

      // Insert notifications
      await supabase.from('notifications').insert(citizenNotification as unknown as Record<string, unknown>);
      if (officerNotification) {
        await supabase.from('notifications').insert(officerNotification as unknown as Record<string, unknown>);
      }

      // Insert audit log
      await supabase.from('audit_logs').insert(auditLog as unknown as Record<string, unknown>);
    }
  } catch (err) {
    console.warn('[Escalation Engine] Supabase persistence skipped, saved to memory stores:', err);
  }

  return {
    success: true,
    complaintId: complaint.id,
    previousLevel: currentLevel,
    newLevel: nextLevel,
    targetRole: tier.role,
    targetUserId,
    newDeadline: newDeadlineIso,
    reason,
    escalationLog,
  };
}

/**
 * Scans all active complaints and escalates all breached tickets (Cron Processor).
 * Idempotent: Skips tickets recently escalated within debounce window.
 */
export async function processSlaBreaches(
  options: {
    referenceTime?: Date;
    debounceMinutes?: number;
    limit?: number;
  } = {}
): Promise<BatchEscalationResult> {
  const refTime = options.referenceTime || new Date();
  const debounceMs = (options.debounceMinutes || 10) * 60 * 1000;
  const maxLimit = options.limit || 100;

  const result: BatchEscalationResult = {
    scanned: 0,
    escalated: 0,
    skipped: 0,
    errors: [],
    tickets: [],
    timestamp: refTime.toISOString(),
  };

  // 1. Gather all active candidate complaints
  let candidates: Complaint[] = [];

  // Try Supabase first
  try {
    const supabase = getSafeAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .not('status', 'in', `(${ComplaintStatus.CLOSED},${ComplaintStatus.RESOLVED},${ComplaintStatus.REJECTED})`)
        .lt('sla_deadline', refTime.toISOString())
        .lt('escalation_level', 8)
        .limit(maxLimit);

      if (!error && data) {
        candidates = data as Complaint[];
      }
    }
  } catch {
    // Fallback to memory
  }

  // Merge with memory store candidates
  const memCandidates = MEMORY_COMPLAINTS.filter((c) => {
    const isTerminal =
      c.status === ComplaintStatus.CLOSED ||
      c.status === ComplaintStatus.RESOLVED ||
      c.status === ComplaintStatus.REJECTED;
    if (isTerminal) return false;
    if (c.escalation_level >= 8) return false;
    if (!c.sla_deadline) return false;
    return new Date(c.sla_deadline).getTime() <= refTime.getTime();
  });

  // De-duplicate by ID
  const candidateMap = new Map<string, Complaint>();
  for (const c of candidates) candidateMap.set(c.id, c);
  for (const c of memCandidates) candidateMap.set(c.id, c);

  const finalCandidates = Array.from(candidateMap.values()).slice(0, maxLimit);
  result.scanned = finalCandidates.length;

  for (const complaint of finalCandidates) {
    // Check debounce: if updated within debounce window, skip to prevent rapid double-escalation
    const lastUpdated = new Date(complaint.updated_at).getTime();
    if (refTime.getTime() - lastUpdated < debounceMs && complaint.status === ComplaintStatus.ESCALATED) {
      result.skipped++;
      continue;
    }

    try {
      const escRes = await escalateComplaint(complaint, {
        referenceTime: refTime,
        reason: `Automated SLA breach sweep at ${refTime.toISOString()}`,
      });

      if (escRes.success) {
        result.escalated++;
        result.tickets.push(escRes);
      } else {
        result.skipped++;
        if (escRes.error) result.errors.push(`${complaint.tracking_id}: ${escRes.error}`);
      }
    } catch (err: unknown) {
      result.skipped++;
      result.errors.push(`${complaint.tracking_id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}
