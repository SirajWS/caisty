// Legacy route module — kept in sync with registerPublicLicenseRoutes heartbeat handler.
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import { licenseEvents } from "../db/schema/licenseEvents.js";
import {
  authenticateDeviceHeartbeat,
  formatPosDeviceAuthFailure,
} from "../lib/posDeviceAuth.js";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

type HeartbeatBody = {
  deviceId: string;
};

const devicesHeartbeatRoutes = async (app: FastifyInstance) => {
  app.post<{ Body: HeartbeatBody }>(
    "/devices/heartbeat",
    async (request, reply) => {
      const body = request.body ?? ({} as HeartbeatBody);
      const { deviceId } = body;

      if (!deviceId) {
        reply.code(400);
        return {
          ok: false,
          reason: "missing_device_id",
          message: "Field 'deviceId' is required.",
        };
      }

      if (!isUuid(deviceId)) {
        reply.code(400);
        return {
          ok: false,
          reason: "invalid_device_id",
          message: "deviceId must be a UUID returned by /devices/bind",
        };
      }

      const auth = await authenticateDeviceHeartbeat(deviceId);

      if (!auth.ok) {
        reply.code(auth.statusCode);
        return formatPosDeviceAuthFailure(auth);
      }

      const now = new Date();

      const [updated] = await db
        .update(devices)
        .set({
          lastHeartbeatAt: now,
          lastSeenAt: now,
        } as typeof devices.$inferInsert)
        .where(eq(devices.id, deviceId))
        .returning();

      if (!updated) {
        reply.code(404);
        return formatPosDeviceAuthFailure({
          ok: false,
          error: "device_not_found",
          statusCode: 404,
        });
      }

      if (updated.licenseId) {
        await db.insert(licenseEvents).values({
          orgId: updated.orgId,
          licenseId: updated.licenseId,
          type: "heartbeat",
          metadata: {
            deviceId: updated.id,
          },
        });
      }

      return {
        ok: true,
        device: {
          id: updated.id,
          lastHeartbeatAt: updated.lastHeartbeatAt,
        },
      };
    },
  );
};

export default devicesHeartbeatRoutes;
