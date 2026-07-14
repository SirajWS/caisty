import { formatMinorUnits } from "../money/formatMinorUnits";
import type {
  DeriveReceiptsInput,
  ReceiptEventRow,
  ReceiptPaymentCard,
  ReceiptsDerivedState,
  ReceiptsKpi,
  ReceiptTableRow,
} from "./types";

function formatMoney(minor: number, currency: string, locale: string): string {
  return formatMinorUnits(minor, currency, locale);
}

function formatDate(iso: string | null, locale: string, timezone: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  });
}

function formatTime(iso: string | null, locale: string, timezone: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
}

function formatPaymentLabel(
  method: string | null | undefined,
  t: DeriveReceiptsInput["t"],
): string {
  if (!method?.trim()) return "—";
  const m = method.trim().toLowerCase();
  if (m === "cash" || m.includes("cash")) return t.receipts.paymentCash;
  if (
    m === "card" ||
    m.includes("card") ||
    m === "credit" ||
    m === "debit"
  ) {
    return t.receipts.paymentCard;
  }
  if (m === "voucher" || m.includes("voucher") || m.includes("gift")) {
    return t.receipts.paymentVoucher;
  }
  return t.receipts.paymentOther;
}

function formatStatusLabel(status: string, t: DeriveReceiptsInput["t"]): string {
  switch (status) {
    case "active":
      return t.receipts.statusActive;
    case "refunded":
      return t.receipts.statusRefunded;
    case "partial_refund":
      return t.receipts.statusPartialRefund;
    case "voided":
      return t.receipts.statusVoided;
    default:
      return status;
  }
}

function formatFiscalStatus(status: string, dash: string): string {
  const s = status.trim();
  if (!s) return dash;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatEventLabel(
  eventType: string,
  t: DeriveReceiptsInput["t"],
): string {
  switch (eventType) {
    case "created":
      return t.receipts.eventCreated;
    case "printed":
      return t.receipts.eventPrinted;
    case "reprinted":
      return t.receipts.eventReprinted;
    default:
      return eventType;
  }
}

function waitingKpi(id: string, label: string, hint: string, dash: string): ReceiptsKpi {
  return { id, label, value: dash, hint };
}

function deriveSummary(input: DeriveReceiptsInput): ReceiptsKpi[] {
  const r = input.t.receipts;
  const dash = input.t.labels.dash;
  const page = input.data.page;

  if (!page || page.receipts.length === 0) {
    const hint = r.waitingPosSyncShort;
    return [
      waitingKpi("receipts_today", r.kpiReceiptsToday, hint, dash),
      waitingKpi("active", r.kpiActiveReceipts, hint, dash),
      waitingKpi("printed", r.kpiPrinted, hint, dash),
      waitingKpi("reprinted", r.kpiReprinted, hint, dash),
      waitingKpi("refunds", r.kpiRefunds, hint, dash),
    ];
  }

  const { summary } = page;
  return [
    {
      id: "receipts_today",
      label: r.kpiReceiptsToday,
      value: String(summary.receiptsCount),
    },
    {
      id: "active",
      label: r.kpiActiveReceipts,
      value: String(summary.activeCount),
    },
    {
      id: "printed",
      label: r.kpiPrinted,
      value: String(summary.printedCount),
    },
    {
      id: "reprinted",
      label: r.kpiReprinted,
      value: String(summary.reprintedCount),
    },
    {
      id: "refunds",
      label: r.kpiRefunds,
      value: String(summary.refundsCount),
    },
  ];
}

function derivePayments(input: DeriveReceiptsInput): ReceiptPaymentCard[] {
  const r = input.t.receipts;
  const dash = input.t.labels.dash;
  const page = input.data.page;

  if (!page || page.receipts.length === 0) {
    return [
      { id: "cash", label: r.paymentCash, value: dash, tone: "unknown" },
      { id: "card", label: r.paymentCard, value: dash, tone: "unknown" },
      { id: "voucher", label: r.paymentVoucher, value: dash, tone: "unknown" },
      { id: "other", label: r.paymentOther, value: dash, tone: "unknown" },
    ];
  }

  const { paymentSummary } = page.summary;
  const currency = paymentSummary.currency || "EUR";

  const card = (
    id: ReceiptPaymentCard["id"],
    label: string,
    cents: number,
  ): ReceiptPaymentCard => ({
    id,
    label,
    value: formatMoney(cents, currency, input.locale),
    tone: cents > 0 ? "ok" : "unknown",
  });

  return [
    card("cash", r.paymentCash, paymentSummary.cashCents),
    card("card", r.paymentCard, paymentSummary.cardCents),
    card("voucher", r.paymentVoucher, paymentSummary.voucherCents),
    card("other", r.paymentOther, paymentSummary.otherCents),
  ];
}

function mapReceiptRow(
  receipt: NonNullable<DeriveReceiptsInput["data"]["page"]>["receipts"][number],
  input: DeriveReceiptsInput,
): ReceiptTableRow {
  const dash = input.t.labels.dash;
  const timezone = input.data.page?.timezone ?? "Europe/Berlin";

  const lastEventLabel = receipt.lastEventType
    ? formatEventLabel(receipt.lastEventType, input.t)
    : dash;

  return {
    id: receipt.id,
    receiptNumber:
      receipt.receiptNumber?.trim() || receipt.localReceiptId || dash,
    date: formatDate(receipt.issuedAt, input.locale, timezone),
    time: formatTime(receipt.issuedAt, input.locale, timezone),
    cashier: receipt.cashier?.trim() || dash,
    payment: formatPaymentLabel(receipt.paymentMethod, input.t),
    amount: formatMoney(receipt.amountCents, receipt.currency, input.locale),
    status: formatStatusLabel(receipt.status, input.t),
    statusRaw: receipt.status,
    fiscal: formatFiscalStatus(receipt.fiscalStatus, dash),
    printCount: String(receipt.printCount),
    lastEvent: lastEventLabel,
    source: receipt,
  };
}

function mapEventRows(input: DeriveReceiptsInput): ReceiptEventRow[] {
  const dash = input.t.labels.dash;
  const detail = input.data.detail;
  const timezone = input.data.page?.timezone ?? "Europe/Berlin";

  if (!detail) return [];

  return detail.events.map((event) => ({
    id: event.id,
    time: formatTime(event.occurredAt, input.locale, timezone),
    label: formatEventLabel(event.eventType, input.t),
    actor: event.actor?.trim() || dash,
    kind:
      event.eventType === "created"
        ? "created"
        : event.eventType === "printed"
          ? "printed"
          : event.eventType === "reprinted"
            ? "reprinted"
            : "other",
  }));
}

function derivePrintStats(input: DeriveReceiptsInput) {
  const r = input.t.receipts;
  const dash = input.t.labels.dash;
  const detail = input.data.detail;
  const timezone = input.data.page?.timezone ?? "Europe/Berlin";

  if (!detail) {
    return {
      originalPrint: dash,
      reprintCount: dash,
      lastPrintTime: dash,
    };
  }

  const { printStats } = detail;
  return {
    originalPrint: printStats.hasOriginalPrint ? r.printYes : r.printNo,
    reprintCount: String(printStats.reprintCount),
    lastPrintTime: printStats.lastPrintAt
      ? `${formatDate(printStats.lastPrintAt, input.locale, timezone)} ${formatTime(printStats.lastPrintAt, input.locale, timezone)}`
      : dash,
  };
}

export function deriveReceiptsState(input: DeriveReceiptsInput): ReceiptsDerivedState {
  const receipts =
    input.data.page?.receipts.map((receipt) => mapReceiptRow(receipt, input)) ??
    [];

  return {
    summary: deriveSummary(input),
    payments: derivePayments(input),
    receipts,
    events: mapEventRows(input),
    printStats: derivePrintStats(input),
    detailReceipt: input.data.detail?.receipt ?? null,
    hasReceipts: receipts.length > 0,
  };
}
