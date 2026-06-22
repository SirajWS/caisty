import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import { licenses } from "../db/schema/licenses.js";
import { customers } from "../db/schema/customers.js";
import { desc, eq, sql } from "drizzle-orm";

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

export async function registerDevicesRoutes(app: FastifyInstance) {
  // Übersicht aller Devices (Admin)
  app.get("/devices", async (request, reply) => {
    try {
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
      .orderBy(desc(devices.createdAt))
      .limit(500);

    // Safe date conversion helper
    const safeDate = (date: any): string | null => {
      if (!date) return null;
      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        return d.toISOString();
      } catch {
        return null;
      }
    };

    // Gruppieren nach Fingerprint (oder id, falls fingerprint null)
    const grouped = Object.values(
      rows.reduce((acc: Record<string, any>, row: any) => {
        const key = row.fingerprint || row.id;
        if (!key) return acc; // Skip rows without key
        if (!acc[key]) {
          acc[key] = {
            fingerprint: row.fingerprint || null,
            id: String(row.id),
            name: String(row.name ?? ""),
            type: String(row.type ?? ""),
            status: String(row.status ?? ""),
            customerId: row.customerId ? String(row.customerId) : null,
            customerName: row.customerName ? String(row.customerName) : null,
            lastSeenAt: safeDate(row.lastSeenAt),
            lastHeartbeatAt: safeDate(row.lastHeartbeatAt),
            createdAt: safeDate(row.createdAt) || new Date().toISOString(),
            licenses: [],
          };
        }
        if (row.licenseId) {
          acc[key].licenses.push({
            id: String(row.licenseId),
            key: String(row.licenseKey ?? ""),
            plan: String(row.licensePlan ?? ""),
            validFrom: safeDate(row.licenseValidFrom),
            validUntil: safeDate(row.licenseValidUntil),
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
    } catch (err) {
      console.error("Error loading devices", err);
      reply.code(500);
      return {
        error: "Failed to load devices",
        details: err instanceof Error ? err.message : String(err),
      };
    }
  });

  // Device entfernen (Admin) – gibt einen License-Slot frei
  app.delete<{ Params: DeleteDeviceParams }>(
    "/devices/:deviceId",
    deleteDeviceHandler,
  );
  app.delete<{ Params: DeleteDeviceParams }>(
    "/admin/devices/:deviceId",
    deleteDeviceHandler,
  );
}
