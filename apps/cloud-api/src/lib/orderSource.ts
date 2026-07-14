/**
 * Provider / online order classification (Phase 7 Sprint 3.1).
 * Uses the synced `platform` field from POS — no ID heuristics.
 */

import type { PortalReceiptLineItem } from "./portalOrders.js";

export const ORDER_SOURCE = {
  POS: "pos",
  PROVIDER: "provider",
  ONLINE: "online",
  DELIVERY: "delivery",
  UNKNOWN: "unknown",
} as const;

export type OrderSource = (typeof ORDER_SOURCE)[keyof typeof ORDER_SOURCE];

const POS_NATIVE_PLATFORMS = new Set([
  "pos",
  "dine_in",
  "dine-in",
  "in_store",
  "in-store",
  "counter",
  "queue",
]);

const PROVIDER_PLATFORMS = new Set([
  "fake_delivery",
  "delivery",
  "website",
  "web",
  "provider",
  "marketplace",
  "takeaway",
  "webshop",
  "online",
]);

const PROVIDER_LABEL_OVERRIDES: Record<string, string> = {
  fake_delivery: "Fake Delivery",
  uber_eats: "Uber Eats",
  lieferando: "Lieferando",
  wolt: "Wolt",
  deliveroo: "Deliveroo",
};

function normalizePlatformValue(platform: string | null | undefined): string {
  return (platform ?? "").trim().toLowerCase();
}

/** Map raw platform to a normalized order source vocabulary. */
export function normalizeOrderSource(
  platform: string | null | undefined,
): OrderSource {
  const normalized = normalizePlatformValue(platform);
  if (!normalized || POS_NATIVE_PLATFORMS.has(normalized)) {
    return ORDER_SOURCE.POS;
  }
  if (normalized === "delivery" || normalized.endsWith("_delivery")) {
    return ORDER_SOURCE.DELIVERY;
  }
  if (
    normalized === "website" ||
    normalized === "web" ||
    normalized === "webshop" ||
    normalized === "online"
  ) {
    return ORDER_SOURCE.ONLINE;
  }
  if (PROVIDER_PLATFORMS.has(normalized)) {
    return normalized.includes("delivery")
      ? ORDER_SOURCE.DELIVERY
      : ORDER_SOURCE.PROVIDER;
  }
  if (normalized.includes("delivery")) {
    return ORDER_SOURCE.DELIVERY;
  }
  return ORDER_SOURCE.PROVIDER;
}

/** True when the order originated from an external or internal provider channel. */
export function isProviderOrder(platform: string | null | undefined): boolean {
  const normalized = normalizePlatformValue(platform);
  if (!normalized) return false;
  if (POS_NATIVE_PLATFORMS.has(normalized)) return false;
  return normalizeOrderSource(platform) !== ORDER_SOURCE.POS;
}

/** Human-readable provider label from the stored platform value. */
export function formatProviderLabel(
  platform: string | null | undefined,
): string | null {
  const normalized = normalizePlatformValue(platform);
  if (!normalized) return null;
  if (PROVIDER_LABEL_OVERRIDES[normalized]) {
    return PROVIDER_LABEL_OVERRIDES[normalized];
  }
  return normalized
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Short line-item summary for table rows, e.g. "1× Burger, 1× Fries, +2 more". */
export function summarizeOrderLines(
  lines: PortalReceiptLineItem[],
  maxVisible = 2,
): string | null {
  if (!lines.length) return null;

  const parts = lines.slice(0, maxVisible).map((line) => {
    const name = line.productName?.trim() || line.sku?.trim() || "Item";
    return `${line.quantity}× ${name}`;
  });

  if (lines.length > maxVisible) {
    parts.push(`+${lines.length - maxVisible} more`);
  }

  return parts.join(", ");
}

export type ResolvedPaymentStatus = "pending" | "paid" | "unknown";

/** Resolve payment status from synced field or payment records — never from order status. */
export function resolveOrderPaymentStatus(input: {
  paymentStatus: string | null | undefined;
  hasPayments: boolean;
}): ResolvedPaymentStatus {
  const raw = (input.paymentStatus ?? "").trim().toLowerCase();
  if (raw === "paid") return "paid";
  if (raw === "pending") return "pending";
  if (input.hasPayments) return "paid";
  return "pending";
}

export function formatOrderPaymentDisplay(input: {
  paymentMethod: string | null | undefined;
  paymentStatus: ResolvedPaymentStatus;
}): string {
  const method = formatPaymentMethodLabel(input.paymentMethod);
  const status =
    input.paymentStatus === "paid"
      ? "Paid"
      : input.paymentStatus === "pending"
        ? "Pending"
        : "Unknown";
  return `${method} · ${status}`;
}

function formatPaymentMethodLabel(method: string | null | undefined): string {
  const m = (method ?? "").trim().toLowerCase();
  if (!m) return "Unknown";
  if (m === "cash" || m.includes("cash")) return "Cash";
  if (
    m === "card" ||
    m.includes("card") ||
    m === "credit" ||
    m === "debit"
  ) {
    return "Card";
  }
  if (m === "online" || m.includes("online")) return "Online";
  if (m === "voucher" || m.includes("voucher")) return "Voucher";
  return m.charAt(0).toUpperCase() + m.slice(1);
}
