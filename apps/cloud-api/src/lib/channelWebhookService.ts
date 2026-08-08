import { and, eq, isNull } from "drizzle-orm";

import { db } from "../db/client.js";
import { posChannels } from "../db/schema/posChannels.js";
import { posOrderLines, posOrders } from "../db/schema/posSync.js";
import {
  parseChannelWebhookOrder,
  traceProviderOrderStage,
  type ParsedChannelWebhookOrder,
} from "./channelWebhookIngress.js";
import { mergeOrderStatusForSync } from "../posSync/orderStatusMerge.js";
import { mergePaymentStatusForSync } from "../posSync/orderPaymentMerge.js";

type ChannelRow = typeof posChannels.$inferSelect;

function optionalText(value: unknown): string | undefined {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

async function findChannelBySlug(
  slug: string,
  storeId?: string,
): Promise<ChannelRow | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  const rows = await db
    .select()
    .from(posChannels)
    .where(
      and(eq(posChannels.slug, normalizedSlug), isNull(posChannels.deletedAt)),
    );

  if (rows.length === 0) return null;
  if (rows.length === 1) return rows[0]!;

  if (storeId) {
    const match = rows.find((row) => (row.storeId ?? "").trim() === storeId);
    if (match) return match;
  }

  return null;
}

function buildPullSnapshot(
  row: typeof posOrders.$inferSelect,
  lines: typeof posOrderLines.$inferSelect[],
) {
  return {
    id: row.id,
    localOrderId: row.localOrderId,
    providerOrderId: row.providerOrderId,
    platform: row.platform,
    sourceDeviceId: row.deviceId,
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentMethod: null,
    paid: row.paymentStatus === "paid",
    paidAt: null,
    transactionId: null,
    providerPaymentId: null,
    totalCents: row.totalCents,
    currency: row.currency,
    soldAt: row.soldAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lines: lines.map((line) => ({
      id: line.id,
      lineIndex: line.lineIndex,
      productName: line.productName,
      sku: line.sku,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      lineTotalCents: line.lineTotalCents,
      taxRateBps: line.taxRateBps,
      createdAt: line.createdAt.toISOString(),
    })),
  };
}

export class ChannelWebhookService {
  async ingestWebhook(input: {
    slug: string;
    body: unknown;
    rawBody?: unknown;
  }): Promise<
    | {
        ok: true;
        orderId: string;
        pullSnapshot: ReturnType<typeof buildPullSnapshot>;
        trace: ParsedChannelWebhookOrder["trace"] & { stage: string };
      }
    | { ok: false; statusCode: number; code: string; message: string }
  > {
    const parsedBody = parseChannelWebhookOrder(input.slug, input.body);
    if (!parsedBody.ok) {
      return {
        ok: false,
        statusCode: 422,
        code: parsedBody.code,
        message: parsedBody.message,
      };
    }

    traceProviderOrderStage(parsedBody.parsed.order.localOrderId, "incoming_http_body", {
      localOrderId: parsedBody.parsed.order.localOrderId,
      providerOrderId: parsedBody.parsed.order.providerOrderId,
      platform: parsedBody.parsed.order.platform,
      source: parsedBody.parsed.trace.source,
      body: input.body,
    });
    traceProviderOrderStage(parsedBody.parsed.order.localOrderId, "normalized_webhook_body", {
      ...parsedBody.parsed.trace,
    });

    const storeId =
      input.body &&
      typeof input.body === "object" &&
      !Array.isArray(input.body)
        ? optionalText((input.body as Record<string, unknown>).storeId)
        : undefined;

    const channel = await findChannelBySlug(input.slug, storeId);
    if (!channel) {
      return {
        ok: false,
        statusCode: 404,
        code: "channel_not_found",
        message: `No active channel found for slug "${input.slug}".`,
      };
    }

    if (!channel.enabled) {
      return {
        ok: false,
        statusCode: 403,
        code: "channel_disabled",
        message: "Channel is disabled.",
      };
    }

    if (!channel.sourceDeviceId) {
      return {
        ok: false,
        statusCode: 422,
        code: "channel_device_missing",
        message: "Channel has no source device configured for webhook ingress.",
      };
    }

    const orderPayload = parsedBody.parsed.order;

    traceProviderOrderStage(orderPayload.localOrderId, "order_before_db", {
      ...orderPayload,
      payment: parsedBody.parsed.trace,
    });

    const existing = await db
      .select({
        status: posOrders.status,
        paymentStatus: posOrders.paymentStatus,
      })
      .from(posOrders)
      .where(
        and(
          eq(posOrders.orgId, channel.orgId),
          eq(posOrders.deviceId, channel.sourceDeviceId),
          eq(posOrders.localOrderId, orderPayload.localOrderId),
        ),
      )
      .limit(1);

    const mergedStatus = mergeOrderStatusForSync(
      existing[0]?.status,
      orderPayload.status,
    );
    const paymentStatus = mergePaymentStatusForSync(
      existing[0]?.paymentStatus,
      orderPayload.paymentStatus,
    );

    traceProviderOrderStage(orderPayload.localOrderId, "payment_before_db", {
      localOrderId: orderPayload.localOrderId,
      providerOrderId: orderPayload.providerOrderId,
      platform: orderPayload.platform,
      paymentStatus,
      paymentMethod: parsedBody.parsed.trace.paymentMethod,
      paid: parsedBody.parsed.trace.paid,
      paidAt: parsedBody.parsed.trace.paidAt,
      transactionId: parsedBody.parsed.trace.transactionId,
      providerPaymentId: parsedBody.parsed.trace.providerPaymentId,
    });

    let orderRow: typeof posOrders.$inferSelect;
    try {
      const inserted = await db
        .insert(posOrders)
        .values({
          orgId: channel.orgId,
          customerId: channel.customerId,
          deviceId: channel.sourceDeviceId,
          localOrderId: orderPayload.localOrderId,
          providerOrderId: orderPayload.providerOrderId,
          platform: orderPayload.platform,
          status: mergedStatus,
          totalCents: orderPayload.totalCents,
          currency: orderPayload.currency ?? "EUR",
          soldAt: new Date(orderPayload.soldAt),
          paymentStatus,
          customerName: orderPayload.customerName ?? null,
          customerPhone: orderPayload.customerPhone ?? null,
          customerEmail: orderPayload.customerEmail ?? null,
          deliveryAddress: orderPayload.deliveryAddress ?? null,
          customerNote: orderPayload.customerNote ?? null,
        })
        .returning();
      orderRow = inserted[0]!;
    } catch (err: unknown) {
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code?: string }).code)
          : "";
      if (code !== "23505") throw err;

      const updated = await db
        .update(posOrders)
        .set({
          providerOrderId: orderPayload.providerOrderId,
          platform: orderPayload.platform,
          status: mergedStatus,
          totalCents: orderPayload.totalCents,
          currency: orderPayload.currency ?? "EUR",
          soldAt: new Date(orderPayload.soldAt),
          paymentStatus,
          customerName: orderPayload.customerName ?? null,
          customerPhone: orderPayload.customerPhone ?? null,
          customerEmail: orderPayload.customerEmail ?? null,
          deliveryAddress: orderPayload.deliveryAddress ?? null,
          customerNote: orderPayload.customerNote ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(posOrders.orgId, channel.orgId),
            eq(posOrders.deviceId, channel.sourceDeviceId),
            eq(posOrders.localOrderId, orderPayload.localOrderId),
          ),
        )
        .returning();
      orderRow = updated[0]!;
    }

    if (orderPayload.lines.length > 0) {
      await db
        .delete(posOrderLines)
        .where(eq(posOrderLines.orderId, orderRow.id));
      await db.insert(posOrderLines).values(
        orderPayload.lines.map((line) => ({
          orderId: orderRow.id,
          orgId: channel.orgId,
          lineIndex: line.lineIndex,
          productName: line.productName ?? null,
          sku: line.sku ?? null,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          lineTotalCents: line.lineTotalCents,
        })),
      );
    }

    const lineRows = await db
      .select()
      .from(posOrderLines)
      .where(eq(posOrderLines.orderId, orderRow.id));

    traceProviderOrderStage(orderPayload.localOrderId, "stored_db_order", {
      id: orderRow.id,
      localOrderId: orderRow.localOrderId,
      providerOrderId: orderRow.providerOrderId,
      platform: orderRow.platform,
      paymentStatus: orderRow.paymentStatus,
    });

    const pullSnapshot = buildPullSnapshot(orderRow, lineRows);

    traceProviderOrderStage(orderPayload.localOrderId, "pull_snapshot", pullSnapshot);
    traceProviderOrderStage(orderPayload.localOrderId, "realtime_payload", {
      type: "order",
      order: pullSnapshot,
    });

    return {
      ok: true,
      orderId: orderRow.id,
      pullSnapshot,
      trace: {
        ...parsedBody.parsed.trace,
        stage: "webhook_complete",
      },
    };
  }
}

export const channelWebhookService = new ChannelWebhookService();
