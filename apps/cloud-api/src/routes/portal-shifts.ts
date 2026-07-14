import type { FastifyInstance, FastifyRequest } from "fastify";

import { shiftService } from "../lib/shiftService.js";
import { isShiftStatus } from "../lib/shiftTypes.js";
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

export async function registerPortalShiftsRoutes(app: FastifyInstance) {
  /**
   * GET /portal/shifts
   * Read-only shift history for the authenticated portal customer.
   */
  app.get("/portal/shifts", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { message: "Invalid or missing portal token" };
    }

    const query = request.query as {
      status?: string;
      from?: string;
      to?: string;
      deviceId?: string;
      limit?: string;
    };

    const statusRaw = query.status?.trim().toLowerCase();
    const status =
      statusRaw && statusRaw !== "all" && isShiftStatus(statusRaw)
        ? statusRaw
        : "all";

    const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined;

    try {
      const shifts = await shiftService.listShiftsForCustomer({
        orgId: payload.orgId,
        customerId: payload.customerId,
        status,
        deviceId: query.deviceId?.trim() || undefined,
        from: query.from?.trim() || undefined,
        to: query.to?.trim() || undefined,
        limit: Number.isFinite(limit) ? limit : undefined,
      });

      return { shifts };
    } catch (err: unknown) {
      request.log.error(
        { err, customerId: payload.customerId },
        "GET /portal/shifts failed",
      );
      reply.code(500);
      return {
        ok: false,
        error: "Failed to load shifts",
        message: err instanceof Error ? err.message : "Internal server error",
      };
    }
  });
}
