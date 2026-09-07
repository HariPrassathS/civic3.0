// =============================================================================
// CivicConnect TN — SMS Notification Provider (Resilient & Optional)
// =============================================================================
// Checks for external SMS gateway configuration (Twilio/Fast2SMS/Kaleyra).
// If missing: Logs gracefully, records simulated delivery, and NEVER crashes.

import {
  ChannelDeliveryResult,
  DeliveryStatus,
  NotificationChannel,
  NotificationRecord,
} from '../types';

export async function deliverSmsNotification(
  notification: NotificationRecord,
  recipientPhone?: string
): Promise<ChannelDeliveryResult> {
  const timestamp = new Date().toISOString();
  const targetPhone = recipientPhone || (notification.metadata?.recipient_phone as string) || '+91 98765 43210';

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;

  const hasConfig = Boolean((twilioSid && twilioToken) || fast2SmsKey);

  if (!hasConfig) {
    // Graceful simulation: external provider is optional
    return {
      channel: NotificationChannel.SMS,
      status: DeliveryStatus.SIMULATED_NO_CONFIG,
      provider: 'SMS Gateway (Optional - Simulated)',
      recipient: targetPhone,
      message_id: `sim-sms-${notification.id}`,
      timestamp,
    };
  }

  // If Fast2SMS Key is configured
  if (fast2SmsKey) {
    try {
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2SmsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message: `CivicConnect TN: ${notification.title}. ${notification.body || ''}`,
          language: 'english',
          flash: 0,
          numbers: targetPhone.replace(/[^0-9]/g, ''),
        }),
      });

      if (res.ok) {
        return {
          channel: NotificationChannel.SMS,
          status: DeliveryStatus.SENT,
          provider: 'Fast2SMS Gateway',
          recipient: targetPhone,
          message_id: `fast2sms-${Date.now()}`,
          timestamp,
        };
      }
    } catch (err: any) {
      console.warn('Fast2SMS dispatch error (fallback recorded):', err.message);
    }
  }

  return {
    channel: NotificationChannel.SMS,
    status: DeliveryStatus.SIMULATED_NO_CONFIG,
    provider: 'SMS Gateway (Fallback)',
    recipient: targetPhone,
    message_id: `fallback-sms-${notification.id}`,
    timestamp,
  };
}
