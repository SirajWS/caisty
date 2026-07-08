import type { FastifyInstance, FastifyRequest } from "fastify";

import {
  fetchPortalReportsSummary,
  parsePortalReportsPeriod,
} from "../lib/portalReports.js";
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

export async function registerPortalReportsRoutes(app: FastifyInstance) {
  /**
   * GET /portal/reports/summary?period=today|yesterday|7_days|...
   * POS sales analytics for the authenticated portal customer.
   * Monetary fields use ISO 4217 minor units (Cent for EUR, Millime for TND).
   */
  app.get("/portal/reports/summary", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { message: "Invalid or missing portal token" };
    }

    const query = request.query as { period?: string };
    const period = parsePortalReportsPeriod(query.period);

    try {
      return await fetchPortalReportsSummary({
        orgId: payload.orgId,
        customerId: payload.customerId,
        period,
      });
    } catch (err: unknown) {
      request.log.error(
        { err, customerId: payload.customerId, period },
        "GET /portal/reports/summary failed",
      );
      reply.code(500);
      return {
        ok: false,
        error: "Failed to load reports summary",
        message: err instanceof Error ? err.message : "Internal server error",
      };
    }
  });
}
