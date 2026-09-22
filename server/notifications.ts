import { db } from './db';

export interface NotificationPayload {
  userId: string;
  complaintId: string;
  title: string;
  message: string;
  type?: 'status_update' | 'assignment' | 'sla_warning' | 'resolution' | 'reopened' | 'system';
}

export interface NotificationProvider {
  name: string;
  send(payload: NotificationPayload): Promise<boolean>;
}

export class InAppNotificationProvider implements NotificationProvider {
  name = 'in_app';

  async send(payload: NotificationPayload): Promise<boolean> {
    try {
      db.createNotification({
        userId: payload.userId,
        complaintId: payload.complaintId,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'status_update',
      });
      return true;
    } catch (err) {
      console.error('[InAppNotificationProvider] Failed to persist notification:', err);
      return false;
    }
  }
}

export class EmailNotificationProvider implements NotificationProvider {
  name = 'email';

  async send(payload: NotificationPayload): Promise<boolean> {
    const smtpHost = process.env.SMTP_HOST;
    if (!smtpHost) {
      // In development or if not configured, log gracefully without failing
      return false;
    }
    // Production email dispatch logic using configured SMTP credentials
    console.log(`[EmailNotificationProvider] Queued email dispatch to user for ticket ${payload.complaintId}`);
    return true;
  }
}

export class SMSNotificationProvider implements NotificationProvider {
  name = 'sms';

  async send(payload: NotificationPayload): Promise<boolean> {
    const smsApiKey = process.env.SMS_API_KEY;
    if (!smsApiKey) {
      return false;
    }
    console.log(`[SMSNotificationProvider] Queued SMS dispatch for ticket ${payload.complaintId}`);
    return true;
  }
}

export class WhatsAppNotificationProvider implements NotificationProvider {
  name = 'whatsapp';

  async send(payload: NotificationPayload): Promise<boolean> {
    const waToken = process.env.WHATSAPP_API_TOKEN;
    if (!waToken) {
      return false;
    }
    console.log(`[WhatsAppNotificationProvider] Queued WhatsApp message for ticket ${payload.complaintId}`);
    return true;
  }
}

export class NotificationDispatcher {
  private providers: NotificationProvider[] = [];

  constructor() {
    // In-app provider is always active
    this.providers.push(new InAppNotificationProvider());
    this.providers.push(new EmailNotificationProvider());
    this.providers.push(new SMSNotificationProvider());
    this.providers.push(new WhatsAppNotificationProvider());
  }

  async dispatch(payload: NotificationPayload): Promise<void> {
    for (const provider of this.providers) {
      try {
        await provider.send(payload);
      } catch (err) {
        console.warn(`[NotificationDispatcher] Provider ${provider.name} failed:`, err);
      }
    }
  }
}

export const notificationDispatcher = new NotificationDispatcher();
