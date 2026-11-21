// apps/cloud-api/src/routes/admin/devices.ts
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  archiveDevice,
  releaseDevice,
  unarchiveDevice,
} from "../../lib/deviceLifecycleService.js";

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

function requireAdminUserId(
  request: FastifyRequest,
  reply: FastifyReply,
): string | null {
  const user = (request as { user?: { adminUserId?: string } }).user;
  if (!user?.adminUserId) {
    reply.code(403);
    return null;
  }
  return user.adminUserId;
}

async function archiveDeviceHandler(
  request: FastifyRequest<{ Params: ReleaseDeviceParams }>,
  reply: FastifyReply,
) {
  if (!requireAdminUserId(request, reply)) {
    return {
      error: "Forbidden",
      message: "Only administrators may archive devices.",
    };
  }

  const { deviceId } = request.params;
  try {
    const result = await archiveDevice(deviceId);
    if (!result.ok) {
      const status =
        result.code === "not_found"
          ? 404
          : result.code === "bound" || result.code === "invalid_transition"
            ? 409
            : 400;
      reply.code(status);
      return {
        ok: false,
        error: result.code,
        message: result.message,
      };
    }
    return {
      ok: true,
      message: result.alreadyArchived
        ? "Device is already archived from management views."
        : "Device archived from management views. Historical records remain.",
      deviceId: result.deviceId,
      archivedAt: result.archivedAt,
      alreadyArchived: result.alreadyArchived,
      stationCode: result.stationCode,
    };
  } catch (err) {
    request.log.error({ err, deviceId }, "Error archiving device");
    reply.code(500);
    return {
      error: "archive_failed",
      message: "Device could not be archived.",
    };
  }
}

async function unarchiveDeviceHandler(
  request: FastifyRequest<{ Params: ReleaseDeviceParams }>,
  reply: FastifyReply,
) {
  if (!requireAdminUserId(request, reply)) {
    return {
      error: "Forbidden",
      message: "Only administrators may restore archived devices.",
    };
  }

  const { deviceId } = request.params;
  try {
    const result = await unarchiveDevice(deviceId);
    if (!result.ok) {
      reply.code(404);
      return {
        ok: false,
        error: result.code,
        message: result.message,
      };
    }
    return {
      ok: true,
      message: result.restored
        ? "Device restored to management views."
        : "Device is already visible in management views.",
      deviceId: result.deviceId,
      restored: result.restored,
      stationCode: result.stationCode,
    };
  } catch (err) {
    request.log.error({ err, deviceId }, "Error restoring device");
    reply.code(500);
    return {
      error: "unarchive_failed",
      message: "Device could not be restored.",
    };
  }
}

export async function registerAdminDevicesRoutes(app: FastifyInstance) {
  app.delete<{ Params: ReleaseDeviceParams }>(
    "/admin/devices/:deviceId",
    releaseDeviceHandler,
  );
  app.post<{ Params: ReleaseDeviceParams }>(
    "/admin/devices/:deviceId/archive",
    archiveDeviceHandler,
  );
  app.post<{ Params: ReleaseDeviceParams }>(
    "/admin/devices/:deviceId/unarchive",
    unarchiveDeviceHandler,
  );
}
