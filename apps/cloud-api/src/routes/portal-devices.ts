import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import {
  approvePortalDevice,
  blockPortalDevice,
  getPortalDeviceManagement,
  rejectPortalDevice,
  releasePortalDevice,
  unblockPortalDevice,
  type PortalDeviceFailure,
} from "../lib/portalDeviceService.js";
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

function portalActor(payload: PortalJwtPayload) {
  return { customerId: payload.customerId, orgId: payload.orgId };
}

function mapPortalDeviceFailure(
  reply: FastifyReply,
  result: PortalDeviceFailure,
) {
  const status =
    result.code === "DEVICE_NOT_FOUND"
      ? 404
      : result.code === "DEVICE_LIMIT_REACHED" ||
          result.code === "DEVICE_INVALID_TRANSITION"
        ? 409
        : result.code === "DEVICE_ORG_MISMATCH" ||
            result.code === "DEVICE_LICENSE_MISMATCH"
          ? 403
          : 422;

  reply.code(status);
  return {
    ok: false,
    code: result.code,
    message: result.message,
    ...(result.maxDevices !== undefined
      ? { maxDevices: result.maxDevices }
      : {}),
    ...(result.usedSeats !== undefined ? { usedSeats: result.usedSeats } : {}),
    ...(result.remainingSeats !== undefined
      ? { remainingSeats: result.remainingSeats }
      : {}),
  };
}

function mapReleaseFailure(reply: FastifyReply, result: { code: string; message: string }) {
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

export async function registerPortalDevicesRoutes(app: FastifyInstance) {
  /**
   * GET /portal/devices/management
   * Lifecycle-aware device overview with seat summary (no license keys or secrets).
   */
  app.get("/portal/devices/management", async (request, reply) => {
    let payload: PortalJwtPayload;
    try {
      payload = getPortalAuth(request);
    } catch {
      reply.code(401);
      return { ok: false, message: "Invalid or missing portal token" };
    }

    try {
      return await getPortalDeviceManagement(portalActor(payload));
    } catch (err) {
      request.log.error({ err }, "GET /portal/devices/management failed");
      reply.code(500);
      return { ok: false, message: "Failed to load device management data." };
    }
  });

  /**
   * POST /portal/devices/:deviceId/approve
   * Transaction-safe pending → active with seat limit enforcement.
   */
  app.post<{ Params: { deviceId: string } }>(
    "/portal/devices/:deviceId/approve",
    async (request, reply) => {
      let payload: PortalJwtPayload;
      try {
        payload = getPortalAuth(request);
      } catch {
        reply.code(401);
        return { ok: false, message: "Invalid or missing portal token" };
      }

      try {
        const result = await approvePortalDevice(
          request.params.deviceId,
          portalActor(payload),
        );
        if (!result.ok) {
          return mapPortalDeviceFailure(reply, result);
        }
        return result;
      } catch (err) {
        request.log.error({ err }, "POST approve device failed");
        reply.code(500);
        return { ok: false, message: "Device approval failed." };
      }
    },
  );

  /**
   * POST /portal/devices/:deviceId/reject
   */
  app.post<{ Params: { deviceId: string } }>(
    "/portal/devices/:deviceId/reject",
    async (request, reply) => {
      let payload: PortalJwtPayload;
      try {
        payload = getPortalAuth(request);
      } catch {
        reply.code(401);
        return { ok: false, message: "Invalid or missing portal token" };
      }

      try {
        const result = await rejectPortalDevice(
          request.params.deviceId,
          portalActor(payload),
        );
        if (!result.ok) {
          return mapPortalDeviceFailure(reply, result);
        }
        return result;
      } catch (err) {
        request.log.error({ err }, "POST reject device failed");
        reply.code(500);
        return { ok: false, message: "Device rejection failed." };
      }
    },
  );

  /**
   * POST /portal/devices/:deviceId/block
   */
  app.post<{ Params: { deviceId: string } }>(
    "/portal/devices/:deviceId/block",
    async (request, reply) => {
      let payload: PortalJwtPayload;
      try {
        payload = getPortalAuth(request);
      } catch {
        reply.code(401);
        return { ok: false, message: "Invalid or missing portal token" };
      }

      try {
        const result = await blockPortalDevice(
          request.params.deviceId,
          portalActor(payload),
        );
        if (!result.ok) {
          return mapPortalDeviceFailure(reply, result);
        }
        return result;
      } catch (err) {
        request.log.error({ err }, "POST block device failed");
        reply.code(500);
        return { ok: false, message: "Device block failed." };
      }
    },
  );

  /**
   * POST /portal/devices/:deviceId/unblock
   */
  app.post<{ Params: { deviceId: string } }>(
    "/portal/devices/:deviceId/unblock",
    async (request, reply) => {
      let payload: PortalJwtPayload;
      try {
        payload = getPortalAuth(request);
      } catch {
        reply.code(401);
        return { ok: false, message: "Invalid or missing portal token" };
      }

      try {
        const result = await unblockPortalDevice(
          request.params.deviceId,
          portalActor(payload),
        );
        if (!result.ok) {
          return mapPortalDeviceFailure(reply, result);
        }
        return result;
      } catch (err) {
        request.log.error({ err }, "POST unblock device failed");
        reply.code(500);
        return { ok: false, message: "Device unblock failed." };
      }
    },
  );

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
        const result = await releasePortalDevice(
          deviceId,
          portalActor(payload),
        );

        if (!result.ok) {
          return mapReleaseFailure(reply, result);
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
