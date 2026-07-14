import type { FastifyInstance } from "fastify";

import {
  fetchAdminReceiptDetail,
  fetchAdminReceiptsPage,
} from "../../lib/adminReceiptsPage.js";
import {
  changeReceiptPayment,
  generateIdempotencyKey,
  refundReceipt,
  type ChangeReceiptPaymentInput,
  type RefundReceiptInput,
} from "../../lib/receiptMutationService.js";
function parseOptionalInt(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return undefined;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : undefined;
}

function getAdminUser(request: {
  user?: { adminUserId?: string; email?: string };
}) {
  const user = request.user;
  if (!user?.adminUserId) return null;
  return user;
}

export async function registerAdminReceiptsRoutes(app: FastifyInstance) {
  app.get("/admin/receipts", async (request, reply) => {
    const user = getAdminUser(request as { user?: { adminUserId?: string } });
    if (!user) {
      reply.code(403);
      return { ok: false, message: "Admin access required" };
    }

    const query = request.query as {
      period?: string;
      from?: string;
      to?: string;
      customerId?: string;
      customerSearch?: string;
      paymentMethod?: string;
      status?: string;
      search?: string;
      cashier?: string;
      amountMin?: string;
      amountMax?: string;
      sort?: string;
      limit?: string;
      offset?: string;
    };

    try {
      const data = await fetchAdminReceiptsPage({
        period: query.period,
        from: query.from,
        to: query.to,
        customerId: query.customerId,
        customerSearch: query.customerSearch,
        paymentMethod: query.paymentMethod,
        status: query.status,
        search: query.search,
        cashier: query.cashier,
        amountMin: parseOptionalInt(query.amountMin),
        amountMax: parseOptionalInt(query.amountMax),
        sort: query.sort,
        limit: parseOptionalInt(query.limit),
        offset: parseOptionalInt(query.offset),
      });

      return { ok: true, ...data };
    } catch (err: unknown) {
      request.log.error({ err }, "GET /admin/receipts failed");
      reply.code(500);
      return {
        ok: false,
        error: "Failed to load receipts",
        message: err instanceof Error ? err.message : "Internal server error",
      };
    }
  });

  app.get("/admin/receipts/:receiptId", async (request, reply) => {
    const user = getAdminUser(request as { user?: { adminUserId?: string } });
    if (!user) {
      reply.code(403);
      return { ok: false, message: "Admin access required" };
    }

    const { receiptId } = request.params as { receiptId: string };

    try {
      const detail = await fetchAdminReceiptDetail(receiptId);
      if (!detail) {
        reply.code(404);
        return { ok: false, message: "Receipt not found" };
      }

      return { ok: true, ...detail };
    } catch (err: unknown) {
      request.log.error({ err, receiptId }, "GET /admin/receipts/:receiptId failed");
      reply.code(500);
      return {
        ok: false,
        error: "Failed to load receipt detail",
        message: err instanceof Error ? err.message : "Internal server error",
      };
    }
  });

  app.get("/admin/receipts/:receiptId/events", async (request, reply) => {
    const user = getAdminUser(request as { user?: { adminUserId?: string } });
    if (!user) {
      reply.code(403);
      return { ok: false, message: "Admin access required" };
    }

    const { receiptId } = request.params as { receiptId: string };

    try {
      const detail = await fetchAdminReceiptDetail(receiptId);
      if (!detail) {
        reply.code(404);
        return { ok: false, message: "Receipt not found" };
      }

      return {
        ok: true,
        events: detail.timeline,
        refundSummary: detail.refundSummary,
      };
    } catch (err: unknown) {
      request.log.error({ err, receiptId }, "GET /admin/receipts/:receiptId/events failed");
      reply.code(500);
      return {
        ok: false,
        error: "Failed to load receipt events",
        message: err instanceof Error ? err.message : "Internal server error",
      };
    }
  });

  app.post("/admin/receipts/:receiptId/refund", async (request, reply) => {
    const user = getAdminUser(
      request as { user?: { adminUserId?: string; email?: string } },
    );
    if (!user) {
      reply.code(403);
      return { ok: false, message: "Admin access required" };
    }

    const { receiptId } = request.params as { receiptId: string };
    const body = request.body as Partial<RefundReceiptInput>;

    const result = await refundReceipt({
      receiptId,
      amountCents: body.amountCents ?? 0,
      reasonCode: body.reasonCode as RefundReceiptInput["reasonCode"],
      reasonText: body.reasonText,
      refundPaymentMethod: body.refundPaymentMethod ?? "",
      internalNote: body.internalNote,
      idempotencyKey: body.idempotencyKey?.trim() || generateIdempotencyKey(),
      adminUserId: user.adminUserId,
      adminEmail: user.email ?? null,
    });

    if (!result.ok) {
      reply.code(result.statusCode);
      return { ok: false, code: result.code, message: result.message };
    }

    const detail = await fetchAdminReceiptDetail(receiptId);
    return { ok: true, receiptId: result.receiptId, eventId: result.eventId, detail };
  });

  app.post("/admin/receipts/:receiptId/payment-change", async (request, reply) => {
    const user = getAdminUser(
      request as { user?: { adminUserId?: string; email?: string } },
    );
    if (!user) {
      reply.code(403);
      return { ok: false, message: "Admin access required" };
    }

    const { receiptId } = request.params as { receiptId: string };
    const body = request.body as Partial<ChangeReceiptPaymentInput>;

    const result = await changeReceiptPayment({
      receiptId,
      newPaymentMethod: body.newPaymentMethod ?? "",
      reason: body.reason ?? "",
      internalNote: body.internalNote,
      idempotencyKey: body.idempotencyKey?.trim() || generateIdempotencyKey(),
      adminUserId: user.adminUserId,
      adminEmail: user.email ?? null,
    });

    if (!result.ok) {
      reply.code(result.statusCode);
      return { ok: false, code: result.code, message: result.message };
    }

    const detail = await fetchAdminReceiptDetail(receiptId);
    return { ok: true, receiptId: result.receiptId, eventId: result.eventId, detail };
  });
}
