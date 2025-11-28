import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { devices } from "../db/schema/devices";
import { licenses } from "../db/schema/licenses";
import { customers } from "../db/schema/customers";
import { desc, eq } from "drizzle-orm";

export async function registerDevicesRoutes(app: FastifyInstance) {
  // Übersicht aller Devices (Admin)
  app.get("/devices", async (request) => {
    const user = (request as any).user;
    const orgId = user?.orgId;

    // Rohdaten abrufen
    const rows = await db
      .select({
        id: devices.id,
        name: devices.name,
        type: devices.type,
        status: devices.status,
        fingerprint: devices.fingerprint,
        customerId: devices.customerId,
        licenseId: devices.licenseId,
        lastHeartbeatAt: devices.lastHeartbeatAt,
        lastSeenAt: devices.lastSeenAt,
        createdAt: devices.createdAt,

        licenseKey: licenses.key,
        licensePlan: licenses.plan,
        licenseValidFrom: licenses.validFrom,
        licenseValidUntil: licenses.validUntil,

        customerName: customers.name,
      })
      .from(devices)
      .leftJoin(licenses, eq(devices.licenseId, licenses.id))
      .leftJoin(customers, eq(devices.customerId, customers.id))
      .where(orgId ? eq(devices.orgId, orgId) : undefined)
      .orderBy(desc(devices.createdAt))
      .limit(500);

    // Gruppieren nach Fingerprint (oder id, falls fingerprint null)
    const grouped = Object.values(
      rows.reduce((acc, row) => {
        const key = row.fingerprint || row.id;
        if (!acc[key]) {
          acc[key] = {
            fingerprint: row.fingerprint,
            id: row.id,
            name: row.name,
            type: row.type,
            status: row.status,
            customerId: row.customerId,
            customerName: row.customerName,
            lastSeenAt: row.lastSeenAt,
            lastHeartbeatAt: row.lastHeartbeatAt,
            createdAt: row.createdAt,
            licenses: [],
          };
        }
        if (row.licenseId) {
          acc[key].licenses.push({
            id: row.licenseId,
            key: row.licenseKey,
            plan: row.licensePlan,
            validFrom: row.licenseValidFrom,
            validUntil: row.licenseValidUntil,
          });
        }
        return acc;
      }, {} as Record<string, any>)
    );

    return {
      items: grouped,
      total: grouped.length,
      limit: 500,
      offset: 0,
    };
  });
}
