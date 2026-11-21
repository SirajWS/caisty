import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import { licenses } from "../db/schema/licenses.js";
import { customers } from "../db/schema/customers.js";
import { desc, eq, isNotNull, isNull } from "drizzle-orm";
import {
  mapAdminDeviceRow,
  wantsArchivedDevices,
} from "../lib/adminDeviceDisplay.js";

export async function registerDevicesRoutes(app: FastifyInstance) {
  app.get("/devices", async (request, reply) => {
    try {
      const archived = wantsArchivedDevices(
        request.query as { archived?: string },
      );

      const rows = await db
        .select({
          id: devices.id,
          name: devices.name,
          type: devices.type,
          status: devices.status,
          fingerprint: devices.fingerprint,
          stationCode: devices.stationCode,
          customerId: devices.customerId,
          licenseId: devices.licenseId,
          lastHeartbeatAt: devices.lastHeartbeatAt,
          lastSeenAt: devices.lastSeenAt,
          createdAt: devices.createdAt,
          releasedAt: devices.releasedAt,
          archivedAt: devices.archivedAt,
          licensePlan: licenses.plan,
          licenseStatus: licenses.status,
          licenseValidFrom: licenses.validFrom,
          licenseValidUntil: licenses.validUntil,
          customerName: customers.name,
        })
        .from(devices)
        .leftJoin(licenses, eq(devices.licenseId, licenses.id))
        .leftJoin(customers, eq(devices.customerId, customers.id))
        .where(archived ? isNotNull(devices.archivedAt) : isNull(devices.archivedAt))
        .orderBy(desc(devices.createdAt))
        .limit(500);

      const items = rows.map((row) => {
        const mapped = mapAdminDeviceRow(row);
        return {
          ...mapped,
          licenses: mapped.currentLicense
            ? [
                {
                  id: mapped.currentLicense.id,
                  plan: mapped.currentLicense.plan,
                  validFrom: mapped.currentLicense.validFrom,
                  validUntil: mapped.currentLicense.validUntil,
                },
              ]
            : [],
        };
      });

      return {
        items,
        total: items.length,
        limit: 500,
        offset: 0,
      };
    } catch (err) {
      console.error("Error loading devices", err);
      reply.code(500);
      return {
        error: "Failed to load devices",
        details: err instanceof Error ? err.message : String(err),
      };
    }
  });
}
