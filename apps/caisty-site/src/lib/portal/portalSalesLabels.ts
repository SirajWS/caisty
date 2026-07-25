import type { PortalTranslations } from "../translations/portal";

export function formatPortalPaymentMethod(
  method: string | null | undefined,
  t: PortalTranslations,
): string {
  if (!method?.trim()) return t.labels?.dash ?? "—";
  const m = method.trim().toLowerCase();
  if (m === "cash" || m.includes("cash")) return t.orders?.paymentCash ?? "Cash";
  if (
    m === "card" ||
    m.includes("card") ||
    m === "credit" ||
    m === "debit"
  ) {
    return t.orders?.paymentCard ?? "Card";
  }
  if (m === "voucher" || m.includes("voucher") || m.includes("gift")) {
    return t.orders?.paymentVoucher ?? "Voucher";
  }
  return t.orders?.paymentOther ?? "Other";
}

export type PortalOrderStatusKey =
  | "new"
  | "accepted"
  | "open"
  | "in_progress"
  | "ready"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

const KNOWN_STATUS_KEYS = [
  "new",
  "accepted",
  "open",
  "in_progress",
  "ready",
  "delivered",
  "completed",
  "cancelled",
  "refunded",
] as const satisfies readonly PortalOrderStatusKey[];

const FALLBACK_STATUS_LABELS: Record<PortalOrderStatusKey, string> = {
  new: "New",
  accepted: "Accepted",
  open: "Open",
  in_progress: "In Progress",
  ready: "Ready",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

/** Normalize API / UI status strings without inventing business meaning. */
export function normalizePortalOrderStatusKey(
  status: string | null | undefined,
): PortalOrderStatusKey | null {
  if (typeof status !== "string") return null;
  const key = status.trim().toLowerCase();
  if (!key) return null;
  // US spelling → canonical British key used by API + i18n
  const canonical = key === "canceled" ? "cancelled" : key;
  return (KNOWN_STATUS_KEYS as readonly string[]).includes(canonical)
    ? (canonical as PortalOrderStatusKey)
    : null;
}

function resolveStatusLabelMap(
  t: PortalTranslations | null | undefined,
): Partial<Record<PortalOrderStatusKey, string>> {
  const fromI18n = t?.orders?.statusLabels;
  if (fromI18n && typeof fromI18n === "object") {
    return fromI18n as Partial<Record<PortalOrderStatusKey, string>>;
  }
  return FALLBACK_STATUS_LABELS;
}

export function formatPortalOrderStatus(
  status: string | null | undefined,
  t: PortalTranslations,
): string {
  const dash = t?.labels?.dash ?? "—";
  const key = normalizePortalOrderStatusKey(status);
  if (!key) {
    const raw = typeof status === "string" ? status.trim() : "";
    if (!raw) return dash;
    // Unknown string: neutral display, do not map to a known business status
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  const labels = resolveStatusLabelMap(t);
  const translated = labels[key];
  if (typeof translated === "string" && translated.trim()) {
    return translated;
  }
  return FALLBACK_STATUS_LABELS[key];
}

export function orderStatusTone(
  status: string | null | undefined,
): "ok" | "progress" | "attention" | "muted" | "refund" {
  const key = normalizePortalOrderStatusKey(status);
  switch (key) {
    case "new":
    case "accepted":
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
