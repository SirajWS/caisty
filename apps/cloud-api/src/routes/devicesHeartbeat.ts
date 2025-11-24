// apps/api/src/routes/devicesHeartbeat.ts
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { devices } from "../db/schema/devices";
import { licenses } from "../db/schema/licenses";

type HeartbeatBody = {
  deviceId: string;
};

type HeartbeatResponse = {
  ok: boolean;
  error?: "MISSING_FIELDS" | "DEVICE_NOT_FOUND";
  device?: {
    id: string;
    name: string;
    type: string;
    status: string;
    lastHeartbeatAt: string | null;
    lastSeenAt: string | null;
    licenseId: string | null;
  };
  license?: {
    id: string;
    key: string;
    plan: string;
    status: string;
    validUntil: string | null;
  } | null;
};

const devicesHeartbeatRoutes = async (app: FastifyInstance) => {
  app.post<{ Body: HeartbeatBody; Reply: HeartbeatResponse }>(
    "/devices/heartbeat",
    async (request, reply) => {
      const { deviceId } = request.body;

      if (!deviceId) {
        return reply.status(400).send({
          ok: false,
          error: "MISSING_FIELDS",
        });
      }

      // Device anhand der ID finden
      const device = await db.query.devices.findFirst({
        where: eq(devices.id, deviceId),
      });

      if (!device) {
        return reply.status(404).send({
          ok: false,
          error: "DEVICE_NOT_FOUND",
        });
      }

      const now = new Date();

      const [updatedDevice] = await db
        .update(devices)
        .set(
          {
            // Device bleibt "active", Heartbeat aktualisiert nur "Seen"
            lastHeartbeatAt: now,
            lastSeenAt: now,
          } as any,
        )
        .where(eq(devices.id, device.id))
        .returning();

      // zugehörige License (optional) laden
      let licenseRow: typeof licenses.$inferSelect | null = null;
      if (updatedDevice.licenseId) {
        licenseRow = await db.query.licenses.findFirst({
          where: eq(licenses.id, updatedDevice.licenseId as any),
        });
      }

      return reply.send({
        ok: true,
        device: {
          id: String(updatedDevice.id),
          name: String(updatedDevice.name),
          type: String(updatedDevice.type),
          status: String(updatedDevice.status),
          licenseId: (updatedDevice as any).licenseId ?? null,
          lastHeartbeatAt: updatedDevice.lastHeartbeatAt
            ? new Date(updatedDevice.lastHeartbeatAt as any).toISOString()
            : null,
          lastSeenAt: updatedDevice.lastSeenAt
            ? new Date(updatedDevice.lastSeenAt as any).toISOString()
            : null,
        },
        license: licenseRow
          ? {
              id: String(licenseRow.id),
              key: String(licenseRow.key),
              plan: String(licenseRow.plan),
              status: String(licenseRow.status),
              validUntil: licenseRow.validUntil
                ? new Date(licenseRow.validUntil as any).toISOString()
                : null,
            }
          : null,
      });
    },
  );
};

export default devicesHeartbeatRoutes;
