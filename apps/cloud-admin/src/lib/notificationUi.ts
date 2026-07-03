import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  KeyRound,
  MessageSquare,
  UserPlus,
  Bell,
  RefreshCw,
} from "lucide-react";

export type NotificationCategory =
  | "customer"
  | "payment"
  | "license"
  | "support"
  | "subscription"
  | "other";

export function notificationCategoryFromType(type: string): NotificationCategory {
  if (type === "portal_support_message") return "support";
  if (
    type.includes("payment") ||
    type === "invoice_paid" ||
    type === "invoice_created"
  ) {
    return "payment";
  }
  if (
    type.includes("license") ||
    type === "portal_trial_created"
  ) {
    return "license";
  }
  if (type === "portal_signup") return "customer";
  if (type.includes("subscription")) return "subscription";
  return "other";
}

export function notificationIcon(
  type: string,
  category?: string,
): LucideIcon {
  const cat = category ?? notificationCategoryFromType(type);
  switch (cat) {
    case "customer":
      return UserPlus;
    case "payment":
      return CreditCard;
    case "license":
      return KeyRound;
    case "support":
      return MessageSquare;
    case "subscription":
      return RefreshCw;
    default:
      return Bell;
  }
}

export function notificationCategoryLabel(category: string): string {
  switch (category) {
    case "customer":
      return "Neuer Kunde";
    case "payment":
      return "Zahlung";
    case "license":
      return "Lizenz";
    case "support":
      return "Support";
    case "subscription":
      return "Abo";
    default:
      return "Info";
  }
}

export type DateGroup = "today" | "yesterday" | "week" | "older";

export function groupNotificationDate(iso: string): DateGroup {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  const startWeek = new Date(startToday);
  startWeek.setDate(startWeek.getDate() - 7);

  if (d >= startToday) return "today";
  if (d >= startYesterday) return "yesterday";
  if (d >= startWeek) return "week";
  return "older";
}

export const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This week",
  older: "Older",
};
