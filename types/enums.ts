// =============================================================================
// CivicConnect TN — Enum Types
// =============================================================================
// These mirror the PostgreSQL enums defined in migration 001.
// Keep these in sync with database enums at all times.

/** User roles in the system hierarchy (lowest → highest privilege) */
export enum UserRole {
  CITIZEN = 'citizen',
  FIELD_WORKER = 'field_worker',
  AREA_OFFICER = 'area_officer',
  DEPARTMENT_HEAD = 'department_head',
  CITY_COMMISSIONER = 'city_commissioner',
  DISTRICT_COLLECTOR = 'district_collector',
  DEPARTMENT_SECRETARY = 'department_secretary',
  CHIEF_SECRETARY = 'chief_secretary',
  CHIEF_MINISTER = 'chief_minister',
  ADMIN = 'admin',
}

/** Complaint lifecycle statuses — transitions enforced by state machine */
export enum ComplaintStatus {
  CREATED = 'created',
  AI_PROCESSING = 'ai_processing',
  VALIDATED = 'validated',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLUTION_SUBMITTED = 'resolution_submitted',
  OFFICER_VERIFICATION = 'officer_verification',
  RESOLVED = 'resolved',
  CITIZEN_FEEDBACK = 'citizen_feedback',
  CLOSED = 'closed',
  REJECTED = 'rejected',
  REOPENED = 'reopened',
  ESCALATED = 'escalated',
}

/** Complaint priority levels */
export enum Priority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/** How the complaint was submitted */
export enum ComplaintSource {
  TEXT = 'text',
  VOICE = 'voice',
  MOBILE = 'mobile',
}

/** Types of media attached to complaints */
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
}

/** When in the lifecycle the media was uploaded */
export enum MediaPhase {
  COMPLAINT = 'complaint',
  BEFORE_RESOLUTION = 'before_resolution',
  AFTER_RESOLUTION = 'after_resolution',
}

/** Types of updates recorded on a complaint */
export enum UpdateType {
  STATUS_CHANGE = 'status_change',
  NOTE = 'note',
  REASSIGNMENT = 'reassignment',
  ESCALATION = 'escalation',
  VERIFICATION = 'verification',
  FEEDBACK = 'feedback',
}

/** Types of AI insights generated */
export enum InsightType {
  CLASSIFICATION = 'classification',
  SUMMARY = 'summary',
  SENTIMENT = 'sentiment',
  DUPLICATE_DETECTION = 'duplicate_detection',
  SAFETY_RISK = 'safety_risk',
  RESOLUTION_VERIFICATION = 'resolution_verification',
  TREND = 'trend',
  PREDICTION = 'prediction',
}

/** Notification event types */
export enum NotificationType {
  COMPLAINT_SUBMITTED = 'complaint_submitted',
  ASSIGNED = 'assigned',
  STATUS_CHANGED = 'status_changed',
  SLA_WARNING = 'sla_warning',
  SLA_BREACHED = 'sla_breached',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
  REOPENED = 'reopened',
  VERIFIED = 'verified',
  CLOSED = 'closed',
}

/** Notification delivery channels */
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

/** AI resolution verification result */
export enum VerificationResult {
  VERIFIED = 'verified',
  SUSPICIOUS = 'suspicious',
  REQUIRES_REVIEW = 'requires_review',
}
