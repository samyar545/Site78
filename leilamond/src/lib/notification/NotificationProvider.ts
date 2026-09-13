export interface NotificationMessage {
  userId: string;
  title: string;
  body?: string;
  linkUrl?: string;
}

export interface NotificationProvider {
  readonly key: string; // "in-app" | "sms" | "email" | "push"
  send(message: NotificationMessage): Promise<{ ok: boolean; errorMessage?: string }>;
}

/**
 * پیش‌فرض: اعلان درون‌برنامه‌ای (ذخیره در مدل Notification).
 * SMS/Email/Push بعداً به‌عنوان Providerهای جدا اضافه می‌شوند، بدون تغییر
 * جایی که send() صدا زده می‌شود.
 */
export class InAppNotificationProvider implements NotificationProvider {
  readonly key = "in-app";
  async send(message: NotificationMessage) {
    // پیاده‌سازی واقعی: prisma.notification.create({ data: { ...message, type: ... } })
    return { ok: true };
  }
}

export function getNotificationProviders(): NotificationProvider[] {
  const providers: NotificationProvider[] = [new InAppNotificationProvider()];
  // در آینده: if (process.env.SMS_ENABLED === "true") providers.push(new SmsProvider());
  return providers;
}
