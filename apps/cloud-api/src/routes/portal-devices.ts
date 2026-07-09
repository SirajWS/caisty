import type { FastifyInstance, FastifyRequest } from "fastify";

import { releaseDevice } from "../lib/deviceLifecycleService.js";
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

export async function registerPortalDevicesRoutes(app: FastifyInstance) {
  /**
   * POST /portal/devices/:deviceId/release
   * Soft-release: unbind license seat, keep device row and all POS sales history.
   */
  app.post<{ Params: { deviceId: string } }>(
    "/portal/devices/:deviceId/release",
    async (request, reply) => {
      let payload: PortalJwtPayload;
      try {
        payload = getPortalAuth(request);
      } catch {
        reply.code(401);
        return { ok: false, message: "Invalid or missing portal token" };
      }

      const { deviceId } = request.params;

      try {
        const result = await releaseDevice(deviceId, {
          type: "portal_customer",
          customerId: payload.customerId,
          orgId: payload.orgId,
        });

        if (!result.ok) {
          const status =
            result.code === "not_found"
              ? 404
              : result.code === "forbidden"
                ? 403
                : 409;
          reply.code(status);
          return {
            ok: false,
            code: result.code,
            message: result.message,
          };
        }

        return {
          ok: true,
          deviceId: result.deviceId,
          releasedAt: result.releasedAt,
          licenseDevices: result.licenseDevices,
        };
      } catch (err) {
        request.log.error({ err, deviceId }, "POST /portal/devices/:deviceId/release failed");
        reply.code(500);
        return {
          ok: false,
          code: "release_failed",
          message: "Device could not be released.",
        };
      }
    },
  );
}
