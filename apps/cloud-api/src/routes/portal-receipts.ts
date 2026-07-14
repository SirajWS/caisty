import type { FastifyInstance, FastifyRequest } from "fastify";

import {
  fetchPortalReceiptDetail,
  fetchPortalReceiptsPage,
} from "../lib/portalReceiptsPage.js";
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

export async function registerPortalReceiptsRoutes(app: FastifyInstance) {
  /**
   * GET /portal/receipts
   * Receipt list with period, payment, status, search, and sort filters.
   */
  app.get("/portal/receipts", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { message: "Invalid or missing portal token" };
    }

    const query = request.query as {
      period?: string;
      paymentMethod?: string;
      status?: string;
      search?: string;
      sort?: string;
      limit?: string;
      offset?: string;
      page?: string;
    };

    try {
      return await fetchPortalReceiptsPage({
        orgId: payload.orgId,
        customerId: payload.customerId,
        period: query.period,
        paymentMethod: query.paymentMethod,
        status: query.status,
        search: query.search,
        sort: query.sort,
        limit: query.limit,
        offset: query.offset,
        page: query.page,
      });
    } catch (err: unknown) {
      request.log.error(
        { err, customerId: payload.customerId },
        "GET /portal/receipts failed",
      );
      reply.code(500);
      return {
        ok: false,
        error: "Failed to load receipts",
        message: err instanceof Error ? err.message : "Internal server error",
      };
    }
  });

  /**
   * GET /portal/receipts/:receiptId
   * Receipt detail with line items, events, and print statistics.
   */
  app.get("/portal/receipts/:receiptId", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { message: "Invalid or missing portal token" };
    }

    const { receiptId } = request.params as { receiptId: string };

    try {
      const detail = await fetchPortalReceiptDetail(
        payload.orgId,
        payload.customerId,
        receiptId,
      );

      if (!detail) {
        reply.code(404);
        return { message: "Receipt not found" };
      }

      return detail;
    } catch (err: unknown) {
      request.log.error(
        { err, customerId: payload.customerId, receiptId },
        "GET /portal/receipts/:receiptId failed",
      );
      reply.code(500);
      return {
        ok: false,
        error: "Failed to load receipt detail",
        message: err instanceof Error ? err.message : "Internal server error",
      };
    }
  });
}
