import type { FastifyInstance, FastifyRequest } from "fastify";

import { fetchPortalDashboardBundle } from "../lib/portalPosSales.js";
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

export async function registerPortalDashboardRoutes(app: FastifyInstance) {
  /**
   * GET /portal/dashboard/summary
   * Today's POS sales aggregates for the authenticated portal customer.
   */
  app.get("/portal/dashboard/summary", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { message: "Invalid or missing portal token" };
    }

    try {
      return await fetchPortalDashboardBundle({
        orgId: payload.orgId,
        customerId: payload.customerId,
      });
    } catch (err: unknown) {
      request.log.error(
        { err, customerId: payload.customerId },
        "GET /portal/dashboard/summary failed",
      );
      reply.code(500);
      return {
        ok: false,
        error: "Failed to load dashboard summary",
        message: err instanceof Error ? err.message : "Internal server error",
      };
    }
  });
}
