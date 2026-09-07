// =============================================================================
// CivicConnect TN — Multi-Channel Notification Dispatcher
// =============================================================================
// Coordinates deduplication, user preferences, and parallel channel delivery
// across In-App, Realtime, Email, SMS, and Push channels.

import {
  ChannelDeliveryResult,
  DeliveryStatus,
  DispatchNotificationOptions,
  DispatchNotificationResult,
  NotificationChannel,
  NotificationRecord,
} from './types';
import { generateNotificationFingerprint, isNotificationDuplicate, recordNotificationSent } from './dedup';
import { getUserPreferences, shouldSendToChannel } from './preferences';
import { deliverInAppNotification } from './providers/in-app';
import { deliverRealtimeNotification } from './providers/realtime';
import { deliverEmailNotification } from './providers/email';
import { deliverSmsNotification } from './providers/sms';
import { deliverPushNotification } from './providers/push';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Dispatches a notification across all enabled channels according to user preferences.
 */
export async function dispatchNotification(
  options: DispatchNotificationOptions
): Promise<DispatchNotificationResult> {
  const timestamp = new Date().toISOString();
  const notificationId = generateUuid();

  // 1. DEDUPLICATION CHECK
  const fingerprint = generateNotificationFingerprint(options);
  if (isNotificationDuplicate(fingerprint)) {
    return {
      success: true,
      notificationId,
      isDeduplicated: true,
      deliveryResults: {
        all: {
          channel: NotificationChannel.IN_APP,
          status: DeliveryStatus.SKIPPED_DEDUPLICATED,
          provider: 'Deduplication Sliding Window Filter',
          timestamp,
        },
      },
    };
  }

  // 2. RETRIEVE USER PREFERENCES
  const preferences = await getUserPreferences(options.userId);

  // Target channels to evaluate (default to all 5 channels if not explicitly specified)
  const targetChannels: NotificationChannel[] = options.channels || [
    NotificationChannel.IN_APP,
    NotificationChannel.REALTIME,
    NotificationChannel.EMAIL,
    NotificationChannel.SMS,
    NotificationChannel.PUSH,
  ];

  const deliveryResults: Record<string, ChannelDeliveryResult> = {};

  const notificationRecord: NotificationRecord = {
    id: notificationId,
    user_id: options.userId,
    complaint_id: options.complaintId || null,
    type: options.type,
    title: options.title,
    body: options.body,
    channel: NotificationChannel.IN_APP,
    is_read: false,
    metadata: options.metadata || {},
    created_at: timestamp,
  };

  // 3. PARALLEL DISPATCH ACROSS CHANNELS
  const channelPromises = targetChannels.map(async (channel) => {
    // Check if preference allows this channel for this event
    const allowed = shouldSendToChannel(preferences, channel, options.type);

    if (!allowed) {
      deliveryResults[channel] = {
        channel,
        status: DeliveryStatus.SKIPPED_PREFERENCE,
        provider: 'User Preference Policy',
        recipient: options.userId,
        timestamp,
      };
      return;
    }

    try {
      let result: ChannelDeliveryResult;

      switch (channel) {
        case NotificationChannel.IN_APP:
          result = await deliverInAppNotification(notificationRecord);
          break;

        case NotificationChannel.REALTIME:
          result = await deliverRealtimeNotification(notificationRecord);
          break;

        case NotificationChannel.EMAIL:
          result = await deliverEmailNotification(
            notificationRecord,
            options.recipientEmail || preferences.email
          );
          break;

        case NotificationChannel.SMS:
          result = await deliverSmsNotification(
            notificationRecord,
            options.recipientPhone || preferences.phone
          );
          break;

        case NotificationChannel.PUSH:
          result = await deliverPushNotification(notificationRecord, options.pushToken);
          break;

        default:
          result = {
            channel,
            status: DeliveryStatus.FAILED,
            provider: 'Unknown Provider',
            timestamp,
          };
      }

      deliveryResults[channel] = result;
    } catch (err: any) {
      console.error(`Error delivering to channel ${channel}:`, err);
      deliveryResults[channel] = {
        channel,
        status: DeliveryStatus.FAILED,
        provider: channel,
        error: err.message || 'Channel delivery failed',
        timestamp,
      };
    }
  });

  await Promise.all(channelPromises);

  // 4. RECORD DEDUPLICATION FINGERPRINT
  recordNotificationSent(fingerprint);

  notificationRecord.delivery_results = deliveryResults;

  return {
    success: true,
    notificationId,
    isDeduplicated: false,
    deliveryResults,
    notification: notificationRecord,
  };
}
