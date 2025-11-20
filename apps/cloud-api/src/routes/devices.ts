// apps/cloud-api/src/routes/devices.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { devices } from "../db/schema/devices";
import { licenses } from "../db/schema/licenses";
import { customers } from "../db/schema/customers";
import { desc, eq } from "drizzle-orm";

export async function registerDevicesRoutes(app: FastifyInstance) {
  // Übersicht aller Devices der aktuellen Organisation
  app.get("/devices", async (request) => {
    const user = (request as any).user;
    const orgId = user?.orgId;

    const rows = await db
      .select({
        // Device-Basisdaten
        id: devices.id,
        name: devices.name,
        type: devices.type,
        status: devices.status,
        customerId: devices.customerId,
        licenseId: devices.licenseId,
        lastHeartbeatAt: devices.lastHeartbeatAt,
        createdAt: devices.createdAt,

        // Lizenz-Infos (können null sein)
        licenseKey: licenses.key,
        licensePlan: licenses.plan,
        licenseValidFrom: licenses.validFrom,
        licenseValidUntil: licenses.validUntil,

        // Customer-Name (optional)
        customerName: customers.name,
      })
      .from(devices)
      .leftJoin(licenses, eq(devices.licenseId, licenses.id))
      .leftJoin(customers, eq(devices.customerId, customers.id))
      .where(orgId ? eq(devices.orgId, orgId) : undefined)
      .orderBy(desc(devices.createdAt))
      .limit(200);

    return {
      items: rows,
      total: rows.length,
      limit: 200,
      offset: 0,
    };
  });
}
