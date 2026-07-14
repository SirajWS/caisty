import type { FastifyInstance, FastifyRequest } from "fastify";

import {
  fetchPortalOrderDetail,
  fetchPortalOrdersPage,
  orderBelongsToCustomer,
} from "../lib/portalOrdersPage.js";
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
      return await fetchPortalOrdersPage({
        orgId: payload.orgId,
        customerId: payload.customerId,
      });
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

  /**
   * GET /portal/orders/:orderId
   * Order detail with receipt link, payments, and timeline.
   */
  app.get("/portal/orders/:orderId", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { message: "Invalid or missing portal token" };
    }

    const { orderId } = request.params as { orderId: string };

    try {
      const belongs = await orderBelongsToCustomer({
        orgId: payload.orgId,
        customerId: payload.customerId,
        orderId,
      });
      if (!belongs) {
        reply.code(404);
        return { message: "Order not found" };
      }

      const detail = await fetchPortalOrderDetail({
        orgId: payload.orgId,
        customerId: payload.customerId,
        orderId,
      });

      if (!detail) {
        reply.code(404);
        return { message: "Order not found" };
      }

      return detail;
    } catch (err: unknown) {
      request.log.error(
        { err, customerId: payload.customerId, orderId },
        "GET /portal/orders/:orderId failed",
      );
      reply.code(500);
      return {
        ok: false,
        error: "Failed to load order detail",
        message: err instanceof Error ? err.message : "Internal server error",
      };
    }
  });
}
