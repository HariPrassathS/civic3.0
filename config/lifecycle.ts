// =============================================================================
// CivicConnect TN — Complaint Lifecycle State Machine
// =============================================================================
// Defines valid state transitions. This is the ONLY place transitions are
// defined. All status changes MUST go through this module.

import { ComplaintStatus, UserRole } from '@/types/enums';

/** A valid state transition definition */
export interface Transition {
  from: ComplaintStatus;
  to: ComplaintStatus;
  /** Roles allowed to trigger this transition (empty = system only) */
  allowedRoles: UserRole[];
  /** Whether this transition can be triggered by automated system jobs */
  system: boolean;
  /** Brief description of when this transition occurs */
  description?: string;
}

/** All valid transitions in the complaint lifecycle */
export const VALID_TRANSITIONS: Transition[] = [
  // 1. Initial Intake & Validation
  {
    from: ComplaintStatus.CREATED,
    to: ComplaintStatus.AI_PROCESSING,
    allowedRoles: [],
    system: true,
    description: 'System routes new complaint to AI triage engine',
  },
  {
    from: ComplaintStatus.CREATED,
    to: ComplaintStatus.VALIDATED,
    allowedRoles: [UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: true,
    description: 'Complaint validated directly or by triage officer',
  },
  {
    from: ComplaintStatus.CREATED,
    to: ComplaintStatus.REJECTED,
    allowedRoles: [UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: true,
    description: 'Spam, duplicate, or out-of-jurisdiction complaint rejected',
  },
  {
    from: ComplaintStatus.AI_PROCESSING,
    to: ComplaintStatus.VALIDATED,
    allowedRoles: [UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: true,
    description: 'AI finishes categorization and validates grievance',
  },
  {
    from: ComplaintStatus.AI_PROCESSING,
    to: ComplaintStatus.REJECTED,
    allowedRoles: [UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: true,
    description: 'AI or officer flags as invalid, offensive, or duplicate',
  },
  {
    from: ComplaintStatus.VALIDATED,
    to: ComplaintStatus.REJECTED,
    allowedRoles: [UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: false,
    description: 'Officer rejects invalid complaint post-validation',
  },

  // 2. Assignment & Field Work
  {
    from: ComplaintStatus.VALIDATED,
    to: ComplaintStatus.ASSIGNED,
    allowedRoles: [
      UserRole.AREA_OFFICER,
      UserRole.DEPARTMENT_HEAD,
      UserRole.CITY_COMMISSIONER,
      UserRole.DISTRICT_COLLECTOR,
      UserRole.ADMIN,
    ],
    system: true,
    description: 'Complaint assigned to field worker or contractor unit',
  },
  {
    from: ComplaintStatus.ASSIGNED,
    to: ComplaintStatus.IN_PROGRESS,
    allowedRoles: [UserRole.FIELD_WORKER, UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: false,
    description: 'Field worker acknowledges work and begins site execution',
  },
  {
    from: ComplaintStatus.ASSIGNED,
    to: ComplaintStatus.ASSIGNED,
    allowedRoles: [UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: false,
    description: 'Reassignment to another field team or contractor',
  },

  // 3. Resolution & Verification
  {
    from: ComplaintStatus.ASSIGNED,
    to: ComplaintStatus.RESOLUTION_SUBMITTED,
    allowedRoles: [UserRole.FIELD_WORKER, UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: false,
    description: 'Field worker completes fix directly on site and submits proof',
  },
  {
    from: ComplaintStatus.IN_PROGRESS,
    to: ComplaintStatus.RESOLUTION_SUBMITTED,
    allowedRoles: [UserRole.FIELD_WORKER, UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: false,
    description: 'Field worker uploads after-photos/proof and submits resolution',
  },
  {
    from: ComplaintStatus.RESOLUTION_SUBMITTED,
    to: ComplaintStatus.OFFICER_VERIFICATION,
    allowedRoles: [UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: true,
    description: 'System queues resolution for Area Officer site/data verification',
  },
  {
    from: ComplaintStatus.RESOLUTION_SUBMITTED,
    to: ComplaintStatus.RESOLVED,
    allowedRoles: [
      UserRole.AREA_OFFICER,
      UserRole.DEPARTMENT_HEAD,
      UserRole.CITY_COMMISSIONER,
      UserRole.DISTRICT_COLLECTOR,
      UserRole.ADMIN,
    ],
    system: false,
    description: 'Officer confirms resolution meets civic quality standards',
  },
  {
    from: ComplaintStatus.RESOLUTION_SUBMITTED,
    to: ComplaintStatus.IN_PROGRESS,
    allowedRoles: [UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: false,
    description: 'Officer rejects resolution proof and sends back for rework',
  },
  {
    from: ComplaintStatus.OFFICER_VERIFICATION,
    to: ComplaintStatus.RESOLVED,
    allowedRoles: [
      UserRole.AREA_OFFICER,
      UserRole.DEPARTMENT_HEAD,
      UserRole.CITY_COMMISSIONER,
      UserRole.DISTRICT_COLLECTOR,
      UserRole.ADMIN,
    ],
    system: false,
    description: 'Officer confirms resolution meets civic quality standards',
  },
  {
    from: ComplaintStatus.OFFICER_VERIFICATION,
    to: ComplaintStatus.IN_PROGRESS,
    allowedRoles: [UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: false,
    description: 'Officer rejects resolution proof and sends back for rework',
  },

  // 4. Citizen Feedback & Closure
  {
    from: ComplaintStatus.RESOLVED,
    to: ComplaintStatus.CITIZEN_FEEDBACK,
    allowedRoles: [UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: true,
    description: 'System prompts citizen for satisfaction rating and feedback',
  },
  {
    from: ComplaintStatus.RESOLVED,
    to: ComplaintStatus.CLOSED,
    allowedRoles: [UserRole.CITIZEN, UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: true,
    description: 'Direct closure or auto-closure after 72h with no citizen objection',
  },
  {
    from: ComplaintStatus.RESOLVED,
    to: ComplaintStatus.REOPENED,
    allowedRoles: [UserRole.CITIZEN, UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: false,
    description: 'Citizen or officer flags resolution as unsatisfactory or recurring',
  },
  {
    from: ComplaintStatus.CITIZEN_FEEDBACK,
    to: ComplaintStatus.CLOSED,
    allowedRoles: [UserRole.CITIZEN, UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: true,
    description: 'Citizen rates resolution or auto-closes after timeout',
  },
  {
    from: ComplaintStatus.CITIZEN_FEEDBACK,
    to: ComplaintStatus.REOPENED,
    allowedRoles: [UserRole.CITIZEN, UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: false,
    description: 'Citizen indicates issue was not resolved properly',
  },

  // 5. Reopening Flow
  {
    from: ComplaintStatus.REOPENED,
    to: ComplaintStatus.ASSIGNED,
    allowedRoles: [
      UserRole.AREA_OFFICER,
      UserRole.DEPARTMENT_HEAD,
      UserRole.CITY_COMMISSIONER,
      UserRole.DISTRICT_COLLECTOR,
      UserRole.ADMIN,
    ],
    system: true,
    description: 'Reopened grievance re-assigned for corrective field action',
  },
  {
    from: ComplaintStatus.REOPENED,
    to: ComplaintStatus.IN_PROGRESS,
    allowedRoles: [UserRole.FIELD_WORKER, UserRole.AREA_OFFICER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
    system: false,
    description: 'Field crew resumes corrective work directly',
  },

  // 6. Escalation Flow (SLA Breaches or Senior Oversight)
  { from: ComplaintStatus.CREATED, to: ComplaintStatus.ESCALATED, allowedRoles: [UserRole.ADMIN], system: true, description: 'SLA breach at intake' },
  { from: ComplaintStatus.VALIDATED, to: ComplaintStatus.ESCALATED, allowedRoles: [UserRole.ADMIN], system: true, description: 'SLA breach awaiting assignment' },
  { from: ComplaintStatus.ASSIGNED, to: ComplaintStatus.ESCALATED, allowedRoles: [UserRole.ADMIN], system: true, description: 'SLA breach awaiting worker kickoff' },
  { from: ComplaintStatus.IN_PROGRESS, to: ComplaintStatus.ESCALATED, allowedRoles: [UserRole.ADMIN], system: true, description: 'SLA breach during field resolution' },
  { from: ComplaintStatus.RESOLUTION_SUBMITTED, to: ComplaintStatus.ESCALATED, allowedRoles: [UserRole.ADMIN], system: true, description: 'SLA breach awaiting verification' },
  { from: ComplaintStatus.OFFICER_VERIFICATION, to: ComplaintStatus.ESCALATED, allowedRoles: [UserRole.ADMIN], system: true, description: 'SLA breach in verification stage' },
  { from: ComplaintStatus.REOPENED, to: ComplaintStatus.ESCALATED, allowedRoles: [UserRole.ADMIN], system: true, description: 'SLA breach on reopened grievance' },

  // Escalated Grievance Recovery
  {
    from: ComplaintStatus.ESCALATED,
    to: ComplaintStatus.ASSIGNED,
    allowedRoles: [
      UserRole.AREA_OFFICER,
      UserRole.DEPARTMENT_HEAD,
      UserRole.CITY_COMMISSIONER,
      UserRole.DISTRICT_COLLECTOR,
      UserRole.DEPARTMENT_SECRETARY,
      UserRole.CHIEF_SECRETARY,
      UserRole.CHIEF_MINISTER,
      UserRole.ADMIN,
    ],
    system: false,
    description: 'Senior official reallocates resources and re-assigns priority team',
  },
  {
    from: ComplaintStatus.ESCALATED,
    to: ComplaintStatus.IN_PROGRESS,
    allowedRoles: [
      UserRole.FIELD_WORKER,
      UserRole.AREA_OFFICER,
      UserRole.DEPARTMENT_HEAD,
      UserRole.CITY_COMMISSIONER,
      UserRole.DISTRICT_COLLECTOR,
      UserRole.ADMIN,
    ],
    system: false,
    description: 'Urgent intervention initiated on escalated complaint',
  },
  {
    from: ComplaintStatus.ESCALATED,
    to: ComplaintStatus.RESOLVED,
    allowedRoles: [
      UserRole.DEPARTMENT_HEAD,
      UserRole.CITY_COMMISSIONER,
      UserRole.DISTRICT_COLLECTOR,
      UserRole.ADMIN,
    ],
    system: false,
    description: 'Direct executive resolution of escalated issue',
  },
];

/**
 * Check if a status transition is valid for a given role or system invocation.
 */
export function isValidTransition(
  from: ComplaintStatus,
  to: ComplaintStatus,
  role?: UserRole,
  isSystem = false
): boolean {
  if (from === to && to !== ComplaintStatus.ASSIGNED) {
    return false; // Self-transitions only allowed for re-assignment
  }

  return VALID_TRANSITIONS.some((t) => {
    if (t.from !== from || t.to !== to) return false;
    if (isSystem && t.system) return true;
    if (role && t.allowedRoles.includes(role)) return true;
    return false;
  });
}

/**
 * Get all possible next statuses from a given status for a given role.
 */
export function getNextStatuses(
  currentStatus: ComplaintStatus,
  role?: UserRole
): ComplaintStatus[] {
  const matching = VALID_TRANSITIONS.filter((t) => {
    if (t.from !== currentStatus) return false;
    if (!role) return t.system;
    return t.allowedRoles.includes(role) || t.system;
  });

  return Array.from(new Set(matching.map((t) => t.to)));
}

/**
 * Check if a status is terminal (cannot transition further).
 */
export function isTerminalStatus(status: ComplaintStatus): boolean {
  return status === ComplaintStatus.CLOSED || status === ComplaintStatus.REJECTED;
}

/**
 * Check if a status is considered active/open in SLA monitors.
 */
export function isActiveStatus(status: ComplaintStatus): boolean {
  return (
    status !== ComplaintStatus.CLOSED &&
    status !== ComplaintStatus.REJECTED &&
    status !== ComplaintStatus.RESOLVED &&
    status !== ComplaintStatus.CITIZEN_FEEDBACK
  );
}

/** Human-readable status labels */
export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  [ComplaintStatus.CREATED]: 'Created',
  [ComplaintStatus.AI_PROCESSING]: 'AI Processing',
  [ComplaintStatus.VALIDATED]: 'Validated',
  [ComplaintStatus.ASSIGNED]: 'Assigned',
  [ComplaintStatus.IN_PROGRESS]: 'In Progress',
  [ComplaintStatus.RESOLUTION_SUBMITTED]: 'Resolution Submitted',
  [ComplaintStatus.OFFICER_VERIFICATION]: 'Under Verification',
  [ComplaintStatus.RESOLVED]: 'Resolved',
  [ComplaintStatus.CITIZEN_FEEDBACK]: 'Awaiting Feedback',
  [ComplaintStatus.CLOSED]: 'Closed',
  [ComplaintStatus.REJECTED]: 'Rejected',
  [ComplaintStatus.REOPENED]: 'Reopened',
  [ComplaintStatus.ESCALATED]: 'Escalated',
};

/** Status color styling metadata */
export const STATUS_STYLES: Record<
  ComplaintStatus,
  { bg: string; text: string; border: string; badge: string; stepIndex: number }
> = {
  [ComplaintStatus.CREATED]: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    badge: 'bg-slate-500 text-white',
    stepIndex: 0,
  },
  [ComplaintStatus.AI_PROCESSING]: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-800',
    badge: 'bg-indigo-600 text-white',
    stepIndex: 1,
  },
  [ComplaintStatus.VALIDATED]: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-800',
    badge: 'bg-blue-600 text-white',
    stepIndex: 2,
  },
  [ComplaintStatus.ASSIGNED]: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-800',
    badge: 'bg-purple-600 text-white',
    stepIndex: 3,
  },
  [ComplaintStatus.IN_PROGRESS]: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800',
    badge: 'bg-amber-600 text-white',
    stepIndex: 4,
  },
  [ComplaintStatus.RESOLUTION_SUBMITTED]: {
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-300 dark:border-teal-800',
    badge: 'bg-teal-600 text-white',
    stepIndex: 5,
  },
  [ComplaintStatus.OFFICER_VERIFICATION]: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-300 dark:border-cyan-800',
    badge: 'bg-cyan-600 text-white',
    stepIndex: 6,
  },
  [ComplaintStatus.RESOLVED]: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800',
    badge: 'bg-emerald-600 text-white',
    stepIndex: 7,
  },
  [ComplaintStatus.CITIZEN_FEEDBACK]: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-300 dark:border-sky-800',
    badge: 'bg-sky-600 text-white',
    stepIndex: 8,
  },
  [ComplaintStatus.CLOSED]: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-700',
    badge: 'bg-gray-700 text-white',
    stepIndex: 9,
  },
  [ComplaintStatus.REJECTED]: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-800',
    badge: 'bg-rose-600 text-white',
    stepIndex: -1,
  },
  [ComplaintStatus.REOPENED]: {
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-800',
    badge: 'bg-orange-600 text-white',
    stepIndex: 4,
  },
  [ComplaintStatus.ESCALATED]: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-800',
    badge: 'bg-red-600 text-white',
    stepIndex: -2,
  },
};
