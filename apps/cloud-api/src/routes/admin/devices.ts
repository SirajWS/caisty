// apps/cloud-api/src/routes/admin/devices.ts
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { devices } from "../../db/schema/devices.js";
import { licenses } from "../../db/schema/licenses.js";

type DeleteDeviceParams = { deviceId: string };

async function deleteDeviceHandler(
  request: FastifyRequest<{ Params: DeleteDeviceParams }>,
  reply: FastifyReply,
) {
  const user = (request as { user?: { adminUserId?: string } }).user;
  if (!user?.adminUserId) {
    reply.code(403);
    return {
      error: "Forbidden",
      message: "Nur Administratoren dürfen Geräte löschen.",
    };
  }

  const { deviceId } = request.params;

  try {
    const [existing] = await db
      .select({
        id: devices.id,
        licenseId: devices.licenseId,
        customerId: devices.customerId,
        name: devices.name,
      })
      .from(devices)
      .where(eq(devices.id, deviceId))
      .limit(1);

    if (!existing) {
      reply.code(404);
      return {
        error: "not_found",
        message: "Gerät wurde nicht gefunden.",
      };
    }

    await db.delete(devices).where(eq(devices.id, deviceId));

    let licenseDevices: { used: number; limit: number } | null = null;
    if (existing.licenseId) {
      const [countRow] = await db
        .select({ value: sql<number>`count(*)` })
        .from(devices)
        .where(eq(devices.licenseId, existing.licenseId));

      const [license] = await db
        .select({ maxDevices: licenses.maxDevices })
        .from(licenses)
        .where(eq(licenses.id, existing.licenseId))
        .limit(1);

      licenseDevices = {
        used: Number(countRow?.value ?? 0),
        limit: license?.maxDevices ?? 1,
      };
    }

    return {
      ok: true,
      message: "Gerät wurde entfernt.",
      deviceId: existing.id,
      customerId: existing.customerId,
      licenseId: existing.licenseId,
      licenseDevices,
    };
  } catch (err) {
    request.log.error({ err, deviceId }, "Error deleting device");
    reply.code(500);
    return {
      error: "delete_failed",
      message: "Gerät konnte nicht gelöscht werden.",
    };
  }
}

export async function registerAdminDevicesRoutes(app: FastifyInstance) {
  app.delete<{ Params: DeleteDeviceParams }>(
    "/admin/devices/:deviceId",
    deleteDeviceHandler,
  );
}
