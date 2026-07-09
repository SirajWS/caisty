import { formatMinorUnits } from "../money/formatMinorUnits";

export type PaymentMethodLabels = {
  cash: string;
  card: string;
  voucher: string;
  other: string;
  dash: string;
};

export function formatDocumentMoney(
  amountMinor: number,
  currency: string,
  locale: string,
): string {
  return formatMinorUnits(amountMinor, currency, locale);
}

export function formatDocumentDateTime(
  value: Date,
  locale: string,
  timezone: string,
): string {
  return value.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
}

export function formatDocumentDate(
  value: Date,
  locale: string,
  timezone: string,
): string {
  return value.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });
}

export function formatDocumentTime(
  iso: string | null,
  locale: string,
  timezone: string,
  dash: string,
): string {
  if (!iso) return dash;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return dash;
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
}

export function formatPaymentMethodLabel(
  method: string | null | undefined,
  labels: PaymentMethodLabels,
): string {
  if (!method?.trim()) return labels.dash;
  const m = method.trim().toLowerCase();
  if (m === "cash" || m.includes("cash")) return labels.cash;
  if (
    m === "card" ||
    m.includes("card") ||
    m === "credit" ||
    m === "debit"
  ) {
    return labels.card;
  }
  if (m === "voucher" || m.includes("voucher") || m.includes("gift")) {
    return labels.voucher;
  }
  return labels.other;
}

export function formatStatusLabel(status: string, dash: string): string {
  const s = status.trim();
  if (!s) return dash;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function sanitizeFilenamePart(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "report"
  );
}
