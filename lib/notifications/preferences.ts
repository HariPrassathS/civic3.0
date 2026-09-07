// =============================================================================
// CivicConnect TN — Notification Preferences Store & Validator
// =============================================================================
// Manages per-user channel & event subscriptions with defaults and persistence.

import {
  ChannelPreferences,
  EventPreferences,
  NotificationChannel,
  NotificationEventType,
  NotificationPreferences,
} from './types';
import { createAdminClient } from '@/lib/supabase/admin';

export const DEFAULT_CHANNELS: ChannelPreferences = {
  in_app: true,
  realtime: true,
  email: true,
  sms: true,
  push: true,
};

export const DEFAULT_EVENTS: EventPreferences = {
  [NotificationEventType.COMPLAINT_SUBMITTED]: true,
  [NotificationEventType.ASSIGNED]: true,
  [NotificationEventType.STATUS_CHANGED]: true,
  [NotificationEventType.SLA_WARNING]: true,
  [NotificationEventType.SLA_BREACHED]: true,
  [NotificationEventType.ESCALATED]: true,
  [NotificationEventType.RESOLVED]: true,
  [NotificationEventType.REOPENED]: true,
  [NotificationEventType.VERIFIED]: true,
  [NotificationEventType.CLOSED]: true,
};

// In-memory fallback preferences store: userId -> NotificationPreferences
const PREFERENCES_MEMORY_STORE = new Map<string, NotificationPreferences>();

/**
 * Creates default preferences for a user.
 */
export function createDefaultPreferences(userId: string): NotificationPreferences {
  return {
    user_id: userId,
    channels: { ...DEFAULT_CHANNELS },
    events: { ...DEFAULT_EVENTS },
    updated_at: new Date().toISOString(),
  };
}

/**
 * Retrieves preferences for a user.
 */
export async function getUserPreferences(userId: string): Promise<NotificationPreferences> {
  const memoryPref = PREFERENCES_MEMORY_STORE.get(userId);
  if (memoryPref) return memoryPref;

  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await (supabase as any)
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        const d = data as any;
        const pref: NotificationPreferences = {
          user_id: d.user_id,
          channels: d.channels || DEFAULT_CHANNELS,
          events: d.events || DEFAULT_EVENTS,
          email: d.email,
          phone: d.phone,
          quiet_hours: d.quiet_hours,
          updated_at: d.updated_at || new Date().toISOString(),
        };
        PREFERENCES_MEMORY_STORE.set(userId, pref);
        return pref;
      }
    }
  } catch {
    // Database table might not exist yet or offline, fallback smoothly
  }

  const defaultPref = createDefaultPreferences(userId);
  PREFERENCES_MEMORY_STORE.set(userId, defaultPref);
  return defaultPref;
}

/**
 * Updates user notification preferences.
 */
export async function updateUserPreferences(
  userId: string,
  partial: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const current = await getUserPreferences(userId);

  const updated: NotificationPreferences = {
    ...current,
    ...partial,
    channels: {
      ...current.channels,
      ...(partial.channels || {}),
    },
    events: {
      ...current.events,
      ...(partial.events || {}),
    },
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  PREFERENCES_MEMORY_STORE.set(userId, updated);

  try {
    const supabase = createAdminClient();
    if (supabase) {
      await (supabase as any).from('notification_preferences').upsert({
        user_id: userId,
        channels: updated.channels,
        events: updated.events,
        email: updated.email,
        phone: updated.phone,
        quiet_hours: updated.quiet_hours,
        updated_at: updated.updated_at,
      });
    }
  } catch {
    // Memory fallback is already updated
  }

  return updated;
}

/**
 * Evaluates whether a notification should be delivered to a specific channel
 * given user preferences and event type.
 */
export function shouldSendToChannel(
  preferences: NotificationPreferences,
  channel: NotificationChannel,
  eventType: NotificationEventType
): boolean {
  // 1. Check if the event type is enabled
  const eventEnabled = preferences.events[eventType] ?? true;
  if (!eventEnabled) return false;

  // 2. Check if the delivery channel is enabled
  const channelKey = channel as keyof ChannelPreferences;
  const channelEnabled = preferences.channels[channelKey] ?? true;
  if (!channelEnabled) return false;

  // 3. Check quiet hours if enabled (only applies to noisy channels: SMS & Push)
  if (
    preferences.quiet_hours?.enabled &&
    (channel === NotificationChannel.SMS || channel === NotificationChannel.PUSH)
  ) {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentMinsTotal = currentHours * 60 + currentMinutes;

    const [startH, startM] = (preferences.quiet_hours.start || '22:00').split(':').map(Number);
    const [endH, endM] = (preferences.quiet_hours.end || '07:00').split(':').map(Number);
    const startMinsTotal = startH * 60 + startM;
    const endMinsTotal = endH * 60 + endM;

    // If quiet hours cross midnight (e.g. 22:00 to 07:00)
    if (startMinsTotal > endMinsTotal) {
      if (currentMinsTotal >= startMinsTotal || currentMinsTotal <= endMinsTotal) {
        return false; // In quiet hours, skip SMS/push
      }
    } else {
      if (currentMinsTotal >= startMinsTotal && currentMinsTotal <= endMinsTotal) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Resets preferences memory store (for testing).
 */
export function resetPreferencesStore(): void {
  PREFERENCES_MEMORY_STORE.clear();
}
