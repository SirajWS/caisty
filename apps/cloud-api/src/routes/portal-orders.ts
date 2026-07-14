import type { FastifyInstance, FastifyRequest } from "fastify";
import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import {
  posOrderLines,
  posOrders,
  posReceipts,
  posSalePayments,
} from "../db/schema/posSync.js";
import {
  aggregatePaymentSummary,
  groupOrderLinesByDeviceLocalId,
  pickPrimaryPaymentMethod,
  PORTAL_ORDERS_TIMEZONE,
  resolveReceiptLineItems,
  sqlIsTodayBerlin,
} from "../lib/portalOrders.js";
import {
  mapPortalReceiptRecord,
  toPortalReceiptIso,
} from "../lib/portalReceipts.js";
import { verifyPortalToken } from "../lib/portalJwt.js";

interface PortalJwtPayload {
  customerId: string;
  orgId: string;
  iat: number;
  exp: number;
}

function getPortalAuth(request: FastifyRequest): PortalJwtPayload {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    throw new Error("Missing portal token");
  }
  const token = auth.slice("Bearer ".length);
  return verifyPortalToken(token) as PortalJwtPayload;
}

function isTodayBerlin(column: typeof posOrders.soldAt) {
  return sqlIsTodayBerlin(column);
}

export async function registerPortalOrdersRoutes(app: FastifyInstance) {
  /**
   * GET /portal/orders
   * Today's POS sales for the authenticated portal customer (orders, receipts, payments).
   */
  app.get("/portal/orders", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { message: "Invalid or missing portal token" };
    }

    try {
      const orderRows = await db
        .select({
          id: posOrders.id,
          localOrderId: posOrders.localOrderId,
          soldAt: posOrders.soldAt,
          status: posOrders.status,
          totalCents: posOrders.totalCents,
          currency: posOrders.currency,
          deviceName: devices.name,
        })
        .from(posOrders)
        .innerJoin(devices, eq(posOrders.deviceId, devices.id))
        .where(
          and(
            eq(posOrders.orgId, payload.orgId),
            eq(devices.customerId, payload.customerId),
            isTodayBerlin(posOrders.soldAt),
          ),
        )
        .orderBy(desc(posOrders.soldAt));

      const lineRows = await db
        .select({
          deviceId: posOrders.deviceId,
          localOrderId: posOrders.localOrderId,
          lineIndex: posOrderLines.lineIndex,
          productName: posOrderLines.productName,
          sku: posOrderLines.sku,
          quantity: posOrderLines.quantity,
          unitPriceCents: posOrderLines.unitPriceCents,
          lineTotalCents: posOrderLines.lineTotalCents,
        })
        .from(posOrderLines)
        .innerJoin(posOrders, eq(posOrderLines.orderId, posOrders.id))
        .innerJoin(devices, eq(posOrders.deviceId, devices.id))
        .where(
          and(
            eq(posOrders.orgId, payload.orgId),
            eq(devices.customerId, payload.customerId),
            isTodayBerlin(posOrders.soldAt),
          ),
        )
        .orderBy(posOrderLines.lineIndex);

      const linesByOrderKey = groupOrderLinesByDeviceLocalId(lineRows);

      const receiptRows = await db
        .select({
          id: posReceipts.id,
          deviceId: posReceipts.deviceId,
          localReceiptId: posReceipts.localReceiptId,
          receiptNumber: posReceipts.receiptNumber,
          soldAt: posReceipts.soldAt,
          grossCents: posReceipts.grossCents,
          currency: posReceipts.currency,
          fiscalStatus: posReceipts.fiscalStatus,
          status: posReceipts.status,
          localOrderId: posReceipts.localOrderId,
        })
        .from(posReceipts)
        .innerJoin(devices, eq(posReceipts.deviceId, devices.id))
        .where(
          and(
            eq(posReceipts.orgId, payload.orgId),
            eq(devices.customerId, payload.customerId),
            isTodayBerlin(posReceipts.soldAt),
          ),
        )
        .orderBy(desc(posReceipts.soldAt));

      const paymentRows = await db
        .select({
          localOrderId: posSalePayments.localOrderId,
          localReceiptId: posSalePayments.localReceiptId,
          method: posSalePayments.method,
          amountCents: posSalePayments.amountCents,
          currency: posSalePayments.currency,
        })
        .from(posSalePayments)
        .innerJoin(devices, eq(posSalePayments.deviceId, devices.id))
        .where(
          and(
            eq(posSalePayments.orgId, payload.orgId),
            eq(devices.customerId, payload.customerId),
            isTodayBerlin(posSalePayments.paidAt),
          ),
        );

      const paymentsByOrder = new Map<string, string[]>();
      const paymentsByReceipt = new Map<string, string[]>();
      for (const payment of paymentRows) {
        if (payment.localOrderId) {
          const list = paymentsByOrder.get(payment.localOrderId) ?? [];
          list.push(payment.method);
          paymentsByOrder.set(payment.localOrderId, list);
        }
        if (payment.localReceiptId) {
          const list = paymentsByReceipt.get(payment.localReceiptId) ?? [];
          list.push(payment.method);
          paymentsByReceipt.set(payment.localReceiptId, list);
        }
      }

      const paymentSummary = aggregatePaymentSummary(paymentRows);
      const currency =
        orderRows[0]?.currency ??
        receiptRows[0]?.currency ??
        paymentRows[0]?.currency ??
        "EUR";

      return {
        timezone: PORTAL_ORDERS_TIMEZONE,
        period: "today" as const,
        summary: {
          ordersCount: orderRows.length,
          receiptsCount: receiptRows.length,
          refundsCount: 0,
          openShift: null,
          paymentSummary: {
            ...paymentSummary,
            currency,
          },
        },
        orders: orderRows.map((row) => ({
          id: row.id,
          localOrderId: row.localOrderId,
          soldAt: toPortalReceiptIso(row.soldAt),
          status: row.status,
          paymentMethod: pickPrimaryPaymentMethod(
            paymentsByOrder.get(row.localOrderId) ?? [],
          ),
          amountCents: row.totalCents,
          currency: row.currency,
          cashier: null,
          deviceName: row.deviceName,
        })),
        receipts: receiptRows.map((row) =>
          mapPortalReceiptRecord({
            row,
            paymentMethod: pickPrimaryPaymentMethod(
              paymentsByReceipt.get(row.localReceiptId) ??
                (row.localOrderId
                  ? paymentsByOrder.get(row.localOrderId) ?? []
                  : []),
            ),
            items: resolveReceiptLineItems(
              linesByOrderKey,
              row.deviceId,
              row.localOrderId,
            ),
          }),
        ),
      };
    } catch (err: unknown) {
      request.log.error({ err, customerId: payload.customerId }, "GET /portal/orders failed");
      reply.code(500);
      return {
        ok: false,
        error: "Failed to load orders",
        message: err instanceof Error ? err.message : "Internal server error",
      };
    }
  });
}

// Re-export for tests
export { bucketPaymentMethod, aggregatePaymentSummary };
