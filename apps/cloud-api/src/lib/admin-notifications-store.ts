// apps/cloud-api/src/lib/admin-notifications-store.ts
import { randomUUID } from "node:crypto";

export type AdminNotification = {
  id: string;
  kind: string;         // z. B. "portal_support_message"
  source: string;       // z. B. "portal"
  subject: string;
  title: string;
  message: string;
  description: string;
  createdAt: string;

  customerId?: string;
  customerName?: string;
  customerEmail?: string;

  // z. B. { supportMessageId: "..." }
  data?: any;
};

const ADMIN_NOTIFICATIONS: AdminNotification[] = [];

export function addSupportNotification(args: {
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  subject: string;
  message: string;
  supportMessageId: string;
}) {
  const now = new Date().toISOString();

  const notification: AdminNotification = {
    id: randomUUID(),
    kind: "portal_support_message",
    source: "portal",
    subject: args.subject,
    title: args.subject,
    message: args.message,
    description: args.message,
    createdAt: now,
    customerId: args.customerId,
    customerName: args.customerName,
    customerEmail: args.customerEmail,
    data: {
      supportMessageId: args.supportMessageId,
    },
  };

  // neueste zuerst
  ADMIN_NOTIFICATIONS.unshift(notification);
  return notification;
}

export function listNotifications(limit?: number): AdminNotification[] {
  if (typeof limit === "number") {
    return ADMIN_NOTIFICATIONS.slice(0, limit);
  }
  return ADMIN_NOTIFICATIONS;
}
