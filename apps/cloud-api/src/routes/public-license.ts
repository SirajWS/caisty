// apps/cloud-api/src/routes/public-license.ts
import type { FastifyInstance } from "fastify";
import { and, eq, sql } from "drizzle-orm";

import { db } from "../db/client";
import { licenses } from "../db/schema/licenses";
import { devices } from "../db/schema/devices";
import { licenseEvents } from "../db/schema/licenseEvents";

type VerifyBody = {
  key: string;
  deviceName?: string;
  deviceType?: string;
  fingerprint?: string;
};

type BindBody = {
  licenseKey: string;
  deviceName: string;
  deviceType?: string;
  fingerprint?: string;
};

type HeartbeatBody = {
  deviceId: string;
};

async function findLicenseByKey(key: string) {
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.key, key))
    .limit(1);

  return license ?? null;
}

async function countDevicesForLicense(licenseId: string) {
  const [row] = await db
    .select({ value: sql<number>`count(*)` })
    .from(devices)
    .where(eq(devices.licenseId, licenseId));

  return row?.value ?? 0;
}

export async function registerPublicLicenseRoutes(app: FastifyInstance) {
  // 1) License prüfen
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

    const key = body.key.trim();
    const license = await findLicenseByKey(key);

    if (!license) {
      return {
        ok: false,
        reason: "license_not_found",
        message: "License key not found.",
      };
    }

    const now = new Date();

    // Revoked → klarer Fehler
    if (license.status === "revoked") {
      return {
        ok: false,
        reason: "license_revoked",
        message: "License has been revoked.",
        license: {
          id: license.id,
          key: license.key,
          plan: license.plan,
          status: license.status,
          maxDevices: license.maxDevices,
          validUntil: license.validUntil,
        },
      };
    }

    // Nicht aktiv oder außerhalb Zeitraum → invalid_or_expired
    const notYetValid =
      license.validFrom && license.validFrom.getTime() > now.getTime();
    const expired =
      license.validUntil && license.validUntil.getTime() < now.getTime();

    if (license.status !== "active" || notYetValid || expired) {
      return {
        ok: false,
        reason: "invalid_or_expired",
        message: "License is invalid or expired.",
        license: {
          id: license.id,
          key: license.key,
          plan: license.plan,
          status: license.status,
          maxDevices: license.maxDevices,
          validUntil: license.validUntil,
        },
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

  // 2) Device binden
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

    const license = await findLicenseByKey(body.licenseKey);

    if (!license || license.status !== "active") {
      return {
        ok: false,
        reason: "invalid_or_expired",
        message: "License is invalid, revoked or expired.",
      };
    }

    const used = await countDevicesForLicense(license.id);
    const limit = license.maxDevices ?? 0;

    if (used >= limit) {
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

    // 🔁 Idempotent: gleiches Gerät mit gleichem Fingerprint
    if (body.fingerprint) {
      const [existing] = await db
        .select()
        .from(devices)
        .where(
          and(
            eq(devices.licenseId, license.id),
            eq(devices.fingerprint, body.fingerprint),
          ),
        )
        .limit(1);

      if (existing) {
        return {
          ok: true,
          reused: true,
          device: {
            id: existing.id,
            name: existing.name,
            type: existing.type,
          },
          license: {
            id: license.id,
            key: license.key,
            plan: license.plan,
          },
        };
      }
    }

    const now = new Date();

    const [device] = await db
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
        deviceId: device.id,
        deviceName: device.name,
      },
    });

    reply.code(201);
    return {
      ok: true,
      device: {
        id: device.id,
        name: device.name,
        type: device.type,
      },
      license: {
        id: license.id,
        key: license.key,
        plan: license.plan,
      },
    };
  });

  // 3) Heartbeat
  app.post<{ Body: HeartbeatBody }>(
    "/devices/heartbeat",
    async (request, reply) => {
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

      await db.insert(licenseEvents).values({
        orgId: updated.orgId,
        licenseId: updated.licenseId!,
        type: "heartbeat",
        metadata: {
          deviceId: updated.id,
        },
      });

      return {
        ok: true,
        device: {
          id: updated.id,
          lastHeartbeatAt: updated.lastHeartbeatAt,
        },
      };
    },
  );
}
