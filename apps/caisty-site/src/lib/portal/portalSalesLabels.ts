import type { PortalTranslations } from "../translations/portal";

export function formatPortalPaymentMethod(
  method: string | null | undefined,
  t: PortalTranslations,
): string {
  if (!method?.trim()) return t.labels.dash;
  const m = method.trim().toLowerCase();
  if (m === "cash" || m.includes("cash")) return t.orders.paymentCash;
  if (
    m === "card" ||
    m.includes("card") ||
    m === "credit" ||
    m === "debit"
  ) {
    return t.orders.paymentCard;
  }
  if (m === "voucher" || m.includes("voucher") || m.includes("gift")) {
    return t.orders.paymentVoucher;
  }
  return t.orders.paymentOther;
}

export type PortalOrderStatusKey =
  | "open"
  | "in_progress"
  | "ready"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

export function formatPortalOrderStatus(
  status: string | null | undefined,
  t: PortalTranslations,
): string {
  const key = (status ?? "").trim().toLowerCase() as PortalOrderStatusKey;
  const labels = t.orders.statusLabels;
  if (key in labels) {
    return labels[key as keyof typeof labels];
  }
  const raw = (status ?? "").trim();
  if (!raw) return t.labels.dash;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function orderStatusTone(
  status: string,
): "ok" | "progress" | "attention" | "muted" | "refund" {
  switch (status.trim().toLowerCase()) {
    case "open":
    case "in_progress":
    case "ready":
      return "progress";
    case "delivered":
    case "completed":
      return "ok";
    case "cancelled":
      return "muted";
    case "refunded":
      return "refund";
    default:
      return "muted";
  }
}
