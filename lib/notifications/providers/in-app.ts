// =============================================================================
// CivicConnect TN — In-App Notification Provider
// =============================================================================
// Core reliable delivery provider. Persists notification into Supabase database
// and updates the local in-memory fallback store.

import {
  ChannelDeliveryResult,
  DeliveryStatus,
  NotificationChannel,
  NotificationRecord,
} from '../types';
import { createAdminClient } from '@/lib/supabase/admin';

// In-memory fallback notifications store: userId -> NotificationRecord[]
export const NOTIFICATIONS_MEMORY_STORE: NotificationRecord[] = [];

/**
 * Persists an in-app notification record.
 */
export async function deliverInAppNotification(
  notification: NotificationRecord
): Promise<ChannelDeliveryResult> {
  const timestamp = new Date().toISOString();

  // Always store in memory store for immediate local access & offline demos
  const existingIdx = NOTIFICATIONS_MEMORY_STORE.findIndex((n) => n.id === notification.id);
  if (existingIdx >= 0) {
    NOTIFICATIONS_MEMORY_STORE[existingIdx] = notification;
  } else {
    NOTIFICATIONS_MEMORY_STORE.unshift(notification);
  }

  // Persist into Supabase database
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { error } = await supabase.from('notifications').upsert({
        id: notification.id,
        user_id: notification.user_id,
        complaint_id: notification.complaint_id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        channel: NotificationChannel.IN_APP,
        is_read: notification.is_read,
        metadata: notification.metadata,
        created_at: notification.created_at || timestamp,
      } as any);

      if (error) {
        console.warn('In-app notification DB insert warning (fallback to memory):', error.message);
      }
    }
  } catch (err: any) {
    console.warn('In-app notification DB connection error (memory active):', err.message);
  }

  return {
    channel: NotificationChannel.IN_APP,
    status: DeliveryStatus.DELIVERED,
    provider: 'Supabase Postgres / In-Memory Store',
    recipient: notification.user_id,
    message_id: notification.id,
    timestamp,
  };
}
