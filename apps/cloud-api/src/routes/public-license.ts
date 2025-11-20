// apps/cloud-api/src/routes/public-license.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { licenses } from "../db/schema/licenses";
import { devices } from "../db/schema/devices";
import { licenseEvents } from "../db/schema/licenseEvents";
import {
  and,
  eq,
  gte,
  lte,
  or,
  isNull,
  sql,
} from "drizzle-orm";

type VerifyBody = {
  key: string; // License-Key, z.B. "CSTY-XXXX-XXXX-XXXX"
  deviceName?: string;
  deviceType?: string;
  fingerprint?: string;
};

type BindBody = {
  licenseKey: string; // hier explizit "licenseKey"
  deviceName: string;
  deviceType?: string;
  fingerprint?: string;
};

type HeartbeatBody = {
  deviceId: string;
};

async function findActiveLicenseByKey(key: string) {
  const now = new Date();

  const [license] = await db
    .select()
    .from(licenses)
    .where(
      and(
        eq(licenses.key, key),
        eq(licenses.status, "active"),
        lte(licenses.validFrom, now),
        or(isNull(licenses.validUntil), gte(licenses.validUntil, now)),
      ),
    )
    .limit(1);

  return license ?? null;
}

async function countDevicesForLicense(licenseId: string) {
  const [row] = await db
    .select({ value: sql<number>`count(*)` })
    .from(devices)
    .where(eq(devices.licenseId, licenseId));

  // zur Sicherheit in Number casten
  return row?.value != null ? Number(row.value) : 0;
}

async function findDeviceByFingerprint(orgId: string, fingerprint?: string | null) {
  if (!fingerprint) return null;

  const [device] = await db
    .select()
    .from(devices)
    .where(
      and(
        eq(devices.orgId, orgId),
        eq(devices.fingerprint, fingerprint),
      ),
    )
    .limit(1);

  return device ?? null;
}

export async function registerPublicLicenseRoutes(app: FastifyInstance) {
  // 1) License prüfen – noch ohne Bindung
  app.post<{ Body: VerifyBody }>("/licenses/verify", async (request, reply) => {
    const body = request.body;

    if (!body.key) {
      reply.code(400);
      return {
        ok: false,
        reason: "missing_key",
        message: "Field 'key' is required.",
      };
    }

    const license = await findActiveLicenseByKey(body.key);

    if (!license) {
      // 200 mit ok:false – einfacher für Clients
      return {
        ok: false,
        reason: "invalid_or_expired",
        message: "License is invalid, revoked or expired.",
      };
    }

    const used = await countDevicesForLicense(license.id);
    const remaining = Math.max(0, (license.maxDevices ?? 0) - used);

    return {
      ok: true,
      license: {
        id: license.id,
        key: license.key,
        plan: license.plan,
        status: license.status,
        maxDevices: license.maxDevices,
        validUntil: license.validUntil,
      },
      devices: {
        used,
        limit: license.maxDevices,
        remaining,
      },
    };
  });

  // 2) Device an License binden (idempotent mit Fingerprint)
  app.post<{ Body: BindBody }>("/devices/bind", async (request, reply) => {
    const body = request.body;

    if (!body.licenseKey || !body.deviceName) {
      reply.code(400);
      return {
        ok: false,
        reason: "missing_fields",
        message: "licenseKey and deviceName are required.",
      };
    }

    const license = await findActiveLicenseByKey(body.licenseKey);

    if (!license) {
      return {
        ok: false,
        reason: "invalid_or_expired",
        message: "License is invalid, revoked or expired.",
      };
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // Gibt es schon ein Gerät mit diesem Fingerprint?
    const existingDevice = await findDeviceByFingerprint(
      license.orgId,
      body.fingerprint ?? null,
    );

    // 🟢 FALL 1: Gerät existiert bereits UND ist schon an diese License gebunden
    if (existingDevice && existingDevice.licenseId === license.id) {
      const [updated] = await db
        .update(devices)
        .set({
          name: body.deviceName,
          type: body.deviceType ?? existingDevice.type ?? "pos",
          status: "active",
          lastHeartbeatAt: now,
          updatedAt: nowIso,
        })
        .where(eq(devices.id, existingDevice.id))
        .returning();

      // kein Limit-Check, weil wir nichts „Neues“ verbrauchen
      return {
        ok: true,
        device: {
          id: updated.id,
          name: updated.name,
          type: updated.type,
        },
        license: {
          id: license.id,
          key: license.key,
          plan: license.plan,
        },
      };
    }

    // 🟡 FALL 2: Gerät existiert, aber (noch) andere LicenseId / keine LicenseId
    if (existingDevice && existingDevice.licenseId !== license.id) {
      const used = await countDevicesForLicense(license.id);
      const limit = license.maxDevices ?? 0;

      if (limit > 0 && used >= limit) {
        return {
          ok: false,
          reason: "max_devices_reached",
          message: "Max devices for this license reached.",
          devices: {
            used,
            limit,
          },
        };
      }

      const [updated] = await db
        .update(devices)
        .set({
          name: body.deviceName,
          type: body.deviceType ?? existingDevice.type ?? "pos",
          status: "active",
          licenseId: license.id,
          lastHeartbeatAt: now,
          updatedAt: nowIso,
        })
        .where(eq(devices.id, existingDevice.id))
        .returning();

      await db.insert(licenseEvents).values({
        orgId: license.orgId,
        licenseId: license.id,
        type: "activated",
        metadata: {
          deviceId: updated.id,
          deviceName: updated.name,
          previousLicenseId: existingDevice.licenseId,
        },
      });

      reply.code(201);
      return {
        ok: true,
        device: {
          id: updated.id,
          name: updated.name,
          type: updated.type,
        },
        license: {
          id: license.id,
          key: license.key,
          plan: license.plan,
        },
      };
    }

    // 🔴 FALL 3: Kein Gerät mit diesem Fingerprint → neu anlegen
    const used = await countDevicesForLicense(license.id);
    const limit = license.maxDevices ?? 0;

    if (limit > 0 && used >= limit) {
      return {
        ok: false,
        reason: "max_devices_reached",
        message: "Max devices for this license reached.",
        devices: {
          used,
          limit,
        },
      };
    }

    const [created] = await db
      .insert(devices)
      .values({
        orgId: license.orgId,
        customerId: license.customerId,
        name: body.deviceName,
        type: body.deviceType ?? "pos",
        status: "active",
        licenseId: license.id,
        fingerprint: body.fingerprint ?? null,
        lastHeartbeatAt: now,
      })
      .returning();

    await db.insert(licenseEvents).values({
      orgId: license.orgId,
      licenseId: license.id,
      type: "activated",
      metadata: {
        deviceId: created.id,
        deviceName: created.name,
      },
    });

    reply.code(201);
    return {
      ok: true,
      device: {
        id: created.id,
        name: created.name,
        type: created.type,
      },
      license: {
        id: license.id,
        key: license.key,
        plan: license.plan,
      },
    };
  });

  // 3) Heartbeat vom Device
  app.post<{ Body: HeartbeatBody }>("/devices/heartbeat", async (request, reply) => {
    const body = request.body;

    if (!body.deviceId) {
      reply.code(400);
      return {
        ok: false,
        reason: "missing_device_id",
        message: "Field 'deviceId' is required.",
      };
    }

    const now = new Date();

    const [updated] = await db
      .update(devices)
      .set({
        lastHeartbeatAt: now,
        status: "active",
      })
      .where(eq(devices.id, body.deviceId))
      .returning();

    if (!updated) {
      return {
        ok: false,
        reason: "device_not_found",
        message: "Device not found.",
      };
    }

    if (updated.licenseId) {
      try {
        await db.insert(licenseEvents).values({
          orgId: updated.orgId,
          licenseId: updated.licenseId,
          type: "heartbeat",
          metadata: {
            deviceId: updated.id,
          },
        });
      } catch (err) {
        request.log.warn(
          { err },
          "Failed to insert license event (heartbeat)",
        );
      }
    }

    return {
      ok: true,
      device: {
        id: updated.id,
        lastHeartbeatAt: updated.lastHeartbeatAt,
      },
    };
  });
}
