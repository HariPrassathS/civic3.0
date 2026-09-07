// =============================================================================
// CivicConnect TN — Notification Engine Contracts & Types
// =============================================================================
// Supports 10 lifecycle events, 5 delivery channels (In-App, Realtime, Email, SMS, Push),
// graceful missing-config fallbacks, deduplication, and user preferences.

export enum NotificationEventType {
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

export enum NotificationChannel {
  IN_APP = 'in_app',
  REALTIME = 'realtime',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum DeliveryStatus {
  DELIVERED = 'delivered',
  SENT = 'sent',
  SIMULATED_NO_CONFIG = 'simulated_no_config',
  SKIPPED_PREFERENCE = 'skipped_preference',
  SKIPPED_DEDUPLICATED = 'skipped_deduplicated',
  FAILED = 'failed',
}

export interface ChannelDeliveryResult {
  channel: NotificationChannel;
  status: DeliveryStatus;
  provider: string;
  recipient?: string;
  message_id?: string;
  timestamp: string;
  error?: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  complaint_id: string | null;
  type: NotificationEventType;
  title: string;
  body: string | null;
  channel: NotificationChannel;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  delivery_results?: Record<string, ChannelDeliveryResult>;
  created_at: string;
}

export interface ChannelPreferences {
  in_app: boolean;
  realtime: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface EventPreferences {
  [NotificationEventType.COMPLAINT_SUBMITTED]: boolean;
  [NotificationEventType.ASSIGNED]: boolean;
  [NotificationEventType.STATUS_CHANGED]: boolean;
  [NotificationEventType.SLA_WARNING]: boolean;
  [NotificationEventType.SLA_BREACHED]: boolean;
  [NotificationEventType.ESCALATED]: boolean;
  [NotificationEventType.RESOLVED]: boolean;
  [NotificationEventType.REOPENED]: boolean;
  [NotificationEventType.VERIFIED]: boolean;
  [NotificationEventType.CLOSED]: boolean;
}

export interface NotificationPreferences {
  user_id: string;
  channels: ChannelPreferences;
  events: EventPreferences;
  email?: string;
  phone?: string;
  quiet_hours?: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
  updated_at: string;
}

export interface DispatchNotificationOptions {
  userId: string;
  complaintId?: string | null;
  type: NotificationEventType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  channels?: NotificationChannel[];
  idempotencyKey?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  pushToken?: string;
}

export interface DispatchNotificationResult {
  success: boolean;
  notificationId: string;
  isDeduplicated: boolean;
  deliveryResults: Record<string, ChannelDeliveryResult>;
  notification?: NotificationRecord;
}
