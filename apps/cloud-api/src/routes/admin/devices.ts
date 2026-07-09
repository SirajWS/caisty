// apps/cloud-api/src/routes/admin/devices.ts
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { releaseDevice } from "../../lib/deviceLifecycleService.js";

type ReleaseDeviceParams = { deviceId: string };

async function releaseDeviceHandler(
  request: FastifyRequest<{ Params: ReleaseDeviceParams }>,
  reply: FastifyReply,
) {
  const user = (request as { user?: { adminUserId?: string } }).user;
  if (!user?.adminUserId) {
    reply.code(403);
    return {
      error: "Forbidden",
      message: "Nur Administratoren dürfen Geräte freigeben.",
    };
  }

  const { deviceId } = request.params;

  try {
    const result = await releaseDevice(deviceId, {
      type: "admin",
      adminUserId: user.adminUserId,
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
        error: result.code,
        message: result.message,
      };
    }

    return {
      ok: true,
      message: "Gerät wurde freigegeben.",
      deviceId: result.deviceId,
      customerId: result.customerId,
      licenseId: result.licenseId,
      releasedAt: result.releasedAt,
      licenseDevices: result.licenseDevices,
    };
  } catch (err) {
    request.log.error({ err, deviceId }, "Error releasing device");
    reply.code(500);
    return {
      error: "release_failed",
      message: "Gerät konnte nicht freigegeben werden.",
    };
  }
}

export async function registerAdminDevicesRoutes(app: FastifyInstance) {
  app.delete<{ Params: ReleaseDeviceParams }>(
    "/admin/devices/:deviceId",
    releaseDeviceHandler,
  );
}
