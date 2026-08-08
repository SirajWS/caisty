/** Trace helper for provider order payment diagnosis (Postman/webhook ingress). */
export { traceProviderOrderStage } from "./providerOrderTrace.js";

import { normalizeProviderOrderPayment } from "./normalizeProviderOrderPayment.js";

function optionalText(value: unknown): string | undefined {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function readNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function slugifyPlatform(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function mapWebhookStatus(status: unknown): string {
  const raw = String(status || "new").trim().toLowerCase();
  if (raw === "canceled" || raw === "rejected") return "cancelled";
  if (raw === "confirmed" || raw === "preparing") return "accepted";
  if (raw === "dispatched") return "ready";
  if (raw === "completed") return "delivered";
  return raw || "new";
}

function parseSoldAt(body: Record<string, unknown>): string {
  const createdAt = body.createdAt;
  if (typeof createdAt === "string" && createdAt.trim()) {
    const parsed = Date.parse(createdAt);
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  }
  const n = readNumber(createdAt);
  if (n != null) return new Date(n).toISOString();
  return new Date().toISOString();
}

function parseTotalCents(body: Record<string, unknown>): number {
  const total = readNumber(body.total);
  if (total != null) return Math.round(total * 100);
  const totalCents = readNumber(body.totalCents);
  if (totalCents != null) return Math.round(totalCents);
  return 0;
}

function parseLines(body: Record<string, unknown>): Array<{
  lineIndex: number;
  productName?: string;
  sku?: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}> {
  const items = body.items;
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const qty = Math.max(1, Math.round(readNumber(row.qty ?? row.quantity) ?? 1));
    const unitMajor = readNumber(row.price ?? row.unitPrice) ?? 0;
    const unitPriceCents = Math.round(unitMajor * 100);
    const lineTotalCents =
      readNumber(row.lineTotalCents) != null
        ? Math.round(readNumber(row.lineTotalCents)!)
        : unitPriceCents * qty;

    return {
      lineIndex: index,
      productName: optionalText(row.name ?? row.productName),
      sku: optionalText(row.id ?? row.sku),
      quantity: qty,
      unitPriceCents,
      lineTotalCents,
    };
  });
}

function readCustomerFields(body: Record<string, unknown>) {
  const customer =
    body.customer && typeof body.customer === "object"
      ? (body.customer as Record<string, unknown>)
      : {};

  return {
    customerName: optionalText(customer.name ?? body.customerName),
    customerPhone: optionalText(customer.phone ?? body.customerPhone),
    customerEmail: optionalText(customer.email ?? body.customerEmail),
    deliveryAddress: optionalText(
      body.deliveryAddress ?? body.address ?? customer.address ?? customer.deliveryAddress,
    ),
    customerNote: optionalText(body.customerNote ?? body.note ?? body.notes),
  };
}

export type ParsedChannelWebhookOrder = {
  trace: {
    stage: "normalized_webhook_body";
    localOrderId: string;
    providerOrderId: string;
    platform: string;
    source: string;
    paymentStatus: string;
    paymentMethod: string | null;
    paid: boolean;
    paidAt: string | null;
    transactionId: string | null;
    providerPaymentId: string | null;
  };
  order: {
    localOrderId: string;
    providerOrderId: string;
    platform: string;
    status: string;
    totalCents: number;
    currency?: string;
    soldAt: string;
    paymentStatus: string;
    lines: ReturnType<typeof parseLines>;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    deliveryAddress?: string;
    customerNote?: string;
  };
};

export function parseChannelWebhookOrder(
  channelSlug: string,
  body: unknown,
): { ok: true; parsed: ParsedChannelWebhookOrder } | { ok: false; code: string; message: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, code: "invalid_body", message: "Webhook body must be a JSON object." };
  }

  const record = body as Record<string, unknown>;
  const providerOrderId =
    optionalText(record.providerOrderId) ||
    optionalText(record.id) ||
    optionalText(record.externalId);
  if (!providerOrderId) {
    return {
      ok: false,
      code: "missing_order_id",
      message: "Webhook body must include id or providerOrderId.",
    };
  }

  const platform =
    slugifyPlatform(record.platform) ||
    slugifyPlatform(record.channel) ||
    slugifyPlatform(channelSlug) ||
    "unknown";

  const payment = normalizeProviderOrderPayment({
    platform,
    paymentStatus: optionalText(record.paymentStatus),
    paymentMethod: optionalText(record.paymentMethod),
    paid: record.paid === true ? true : record.paid === false ? false : undefined,
    paidAt: optionalText(record.paidAt),
    transactionId: optionalText(record.transactionId),
    providerPaymentId: optionalText(record.providerPaymentId),
    providerOrderId,
    localOrderId: optionalText(record.localOrderId) || providerOrderId,
    payment: record.payment,
  });

  const localOrderId = optionalText(record.localOrderId) || providerOrderId;
  const customer = readCustomerFields(record);

  const parsed: ParsedChannelWebhookOrder = {
    trace: {
      stage: "normalized_webhook_body",
      localOrderId,
      providerOrderId,
      platform,
      source: optionalText(record.source) || "online",
      paymentStatus: payment.paymentStatus,
      paymentMethod: payment.paymentMethod,
      paid: payment.paid,
      paidAt: payment.paidAt,
      transactionId: payment.transactionId,
      providerPaymentId: payment.providerPaymentId,
    },
    order: {
      localOrderId,
      providerOrderId,
      platform,
      status: mapWebhookStatus(record.status),
      totalCents: parseTotalCents(record),
      currency: optionalText(record.currency)?.toUpperCase(),
      soldAt: parseSoldAt(record),
      paymentStatus: payment.paymentStatus,
      lines: parseLines(record),
      ...customer,
    },
  };

  return { ok: true, parsed };
}

/**
 * Parse inbound channel webhook bodies (Postman / provider shape) into Cloud order fields.
 */
