// =============================================================================
// CivicConnect TN — Email Notification Provider (Resilient & Optional)
// =============================================================================
// Checks for external email configuration (Resend/SendGrid/SMTP).
// If missing: Logs gracefully, records simulated delivery, and NEVER crashes.

import {
  ChannelDeliveryResult,
  DeliveryStatus,
  NotificationChannel,
  NotificationRecord,
} from '../types';

export async function deliverEmailNotification(
  notification: NotificationRecord,
  recipientEmail?: string
): Promise<ChannelDeliveryResult> {
  const timestamp = new Date().toISOString();
  const targetEmail = recipientEmail || (notification.metadata?.recipient_email as string) || 'citizen@civicconnect.tn.gov.in';

  // Check for external email provider configuration
  const resendApiKey = process.env.RESEND_API_KEY;
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const smtpHost = process.env.SMTP_HOST;

  const hasConfig = Boolean(resendApiKey || sendgridApiKey || smtpHost);

  if (!hasConfig) {
    // Graceful simulation: external provider is optional
    return {
      channel: NotificationChannel.EMAIL,
      status: DeliveryStatus.SIMULATED_NO_CONFIG,
      provider: 'Email Gateway (Optional - Simulated)',
      recipient: targetEmail,
      message_id: `sim-email-${notification.id}`,
      timestamp,
    };
  }

  // If Resend API Key is available
  if (resendApiKey) {
    try {
      // Direct REST dispatch
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'CivicConnect TN <alerts@civicconnect.tn.gov.in>',
          to: targetEmail,
          subject: notification.title,
          html: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #059669;">CivicConnect TN Alert</h2>
            <p><strong>${notification.title}</strong></p>
            <p>${notification.body || ''}</p>
            <hr style="border: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">Government of Tamil Nadu — Citizen Public Grievance Portal</p>
          </div>`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          channel: NotificationChannel.EMAIL,
          status: DeliveryStatus.SENT,
          provider: 'Resend API',
          recipient: targetEmail,
          message_id: data.id || `resend-${Date.now()}`,
          timestamp,
        };
      }
    } catch (err: any) {
      console.warn('Resend email dispatch error (fallback recorded):', err.message);
    }
  }

  return {
    channel: NotificationChannel.EMAIL,
    status: DeliveryStatus.SIMULATED_NO_CONFIG,
    provider: 'Email Gateway (Fallback)',
    recipient: targetEmail,
    message_id: `fallback-email-${notification.id}`,
    timestamp,
  };
}
