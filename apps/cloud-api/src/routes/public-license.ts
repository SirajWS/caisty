// apps/cloud-api/src/routes/public-license.ts

import type { FastifyInstance } from "fastify";

import { eq } from "drizzle-orm";



import { db } from "../db/client.js";

import { licenses } from "../db/schema/licenses.js";

import { devices } from "../db/schema/devices.js";

import { licenseEvents } from "../db/schema/licenseEvents.js";

import { customers } from "../db/schema/customers.js";

import { findDeviceById } from "../lib/deviceLifecycleService.js";

import { countBoundDevicesForLicense } from "../lib/deviceSeats.js";

import { seatLimitForApi } from "../lib/deviceLimits.js";

import {

  bindDeviceRequest,

  findLicenseByKey,

} from "../lib/deviceBindService.js";

import {

  DEVICE_STATUS,

  evaluateDevicePosAccess,

} from "../lib/deviceAccessPolicy.js";

import {

  formatDeviceAccessDenial,

  formatPendingBindResponse,

  formatPendingVerifyResponse,

  httpStatusForDeviceAccessCode,

} from "../lib/deviceAccessResponse.js";

import {

  authenticateDeviceHeartbeat,

  formatPosDeviceAuthFailure,

} from "../lib/posDeviceAuth.js";



function isUuid(value: string): boolean {

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(

    value,

  );

}



type CloudCustomerProfile = {

  accountName?: string;

  legalName?: string;

  externalId?: string;

  contact?: {

    firstName?: string;

    lastName?: string;

    email?: string;

    phone?: string;

  };

  address?: {

    country?: string;

    city?: string;

    street?: string;

    zip?: string;

  };

  language?: string;

  notes?: string;

  lastSyncAt?: string;

};



type VerifyBody = {

  key: string;

  deviceId?: string;

  deviceName?: string;

  deviceType?: string;

  fingerprint?: string;

  cloudCustomer?: CloudCustomerProfile;

};



type BindBody = {

  licenseKey: string;

  deviceName: string;

  deviceType?: string;

  fingerprint?: string;

  cloudCustomer?: CloudCustomerProfile;

};



type HeartbeatBody = {

  deviceId: string;

};



async function countDevicesForLicense(licenseId: string) {

  return countBoundDevicesForLicense(licenseId);

}



async function upsertCustomerProfileFromPos(

  license: typeof licenses.$inferSelect,

  cloudProfile?: CloudCustomerProfile,

) {

  if (!license.customerId || !cloudProfile) return;



  const nowIso = new Date().toISOString();



  const [existing] = await db

    .select({ profile: customers.profile })

    .from(customers)

    .where(eq(customers.id, license.customerId))

    .limit(1);



  const prev = (existing?.profile ?? null) as Record<string, unknown> | null;



  const mergedContact = {

    ...((prev?.contact as object) ?? {}),

    ...(cloudProfile.contact ?? {}),

  };



  const mergedAddress = {

    ...((prev?.address as object) ?? {}),

    ...(cloudProfile.address ?? {}),

  };



  const merged: CloudCustomerProfile = {

    ...(prev ?? {}),

    ...cloudProfile,

    contact: mergedContact,

    address: mergedAddress,

    lastSyncAt: cloudProfile.lastSyncAt ?? nowIso,

  };



  await db

    .update(customers as typeof customers)

    .set({ profile: merged } as typeof customers.$inferInsert)

    .where(eq(customers.id, license.customerId));

}



export async function registerPublicLicenseRoutes(app: FastifyInstance) {

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

          validFrom: license.validFrom,

          validUntil: license.validUntil,

        },

      };

    }



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

          validFrom: license.validFrom,

          validUntil: license.validUntil,

        },

      };

    }



    const deviceId = body.deviceId?.trim();



    if (deviceId) {

      if (!isUuid(deviceId)) {

        reply.code(400);

        return {

          ok: false,

          reason: "invalid_device_id",

          message: "deviceId must be a UUID returned by /devices/bind",

        };

      }



      const device = await findDeviceById(deviceId);



      if (!device) {

        return {

          ok: false,

          reason: "device_not_found",

          message: "Device not found.",

        };

      }



      if (device.status === DEVICE_STATUS.PENDING_APPROVAL) {

        if (

          device.pendingLicenseId &&

          String(device.pendingLicenseId) === String(license.id) &&

          String(device.orgId) === String(license.orgId)

        ) {

          reply.code(httpStatusForDeviceAccessCode("DEVICE_PENDING_APPROVAL"));

          return formatPendingVerifyResponse({ id: device.id });

        }

        reply.code(httpStatusForDeviceAccessCode("DEVICE_LICENSE_MISMATCH"));

        return formatDeviceAccessDenial({

          code: "DEVICE_LICENSE_MISMATCH",

          message: "Device is not bound to the provided license.",

        });

      }



      const access = evaluateDevicePosAccess({

        device: {

          orgId: String(device.orgId),

          status: device.status,

          licenseId: device.licenseId,

        },

        license: {

          id: String(license.id),

          orgId: String(license.orgId),

        },

      });



      if (!access.allowed) {

        reply.code(httpStatusForDeviceAccessCode(access.code));

        return formatDeviceAccessDenial(access);

      }



      if (body.cloudCustomer) {

        await upsertCustomerProfileFromPos(license, body.cloudCustomer);

      }



      const used = await countDevicesForLicense(license.id);

      const seat = seatLimitForApi(license.maxDevices);

      const remaining = seat.unlimitedDevices

        ? null

        : Math.max(0, (seat.limit ?? 1) - used);



      return {

        ok: true,

        license: {

          id: license.id,

          key: license.key,

          plan: license.plan,

          status: license.status,

          maxDevices: seat.maxDevices,

          unlimitedDevices: seat.unlimitedDevices,

          validFrom: license.validFrom,

          validUntil: license.validUntil,

        },

        device: {

          id: device.id,

          name: device.name,

          type: device.type,

          status: device.status,

          licenseId: device.licenseId,

        },

        devices: {

          used,

          limit: seat.limit,

          remaining,

          unlimitedDevices: seat.unlimitedDevices,

        },

      };

    }



    const used = await countDevicesForLicense(license.id);

    const seat = seatLimitForApi(license.maxDevices);

    const remaining = seat.unlimitedDevices

      ? null

      : Math.max(0, (seat.limit ?? 1) - used);



    if (body.cloudCustomer) {

      await upsertCustomerProfileFromPos(license, body.cloudCustomer);

    }



    return {

      ok: true,

      license: {

        id: license.id,

        key: license.key,

        plan: license.plan,

        status: license.status,

        maxDevices: seat.maxDevices,

        unlimitedDevices: seat.unlimitedDevices,

        validFrom: license.validFrom,

        validUntil: license.validUntil,

      },

      devices: {

        used,

        limit: seat.limit,

        remaining,

        unlimitedDevices: seat.unlimitedDevices,

      },

    };

  });



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



    const result = await bindDeviceRequest({

      licenseKey: body.licenseKey,

      deviceName: body.deviceName,

      deviceType: body.deviceType,

      fingerprint: body.fingerprint,

    });



    if (result.kind === "error") {

      reply.code(result.httpStatus);

      return {

        ok: false,

        reason: result.reason,

        message: result.message,

        ...(result.devices ? { devices: result.devices } : {}),

      };

    }



    if (result.kind === "pending") {

      reply.code(result.httpStatus);

      return formatPendingBindResponse({

        id: result.device.id,

        name: result.device.name,

        type: result.device.type,

      });

    }



    if (body.cloudCustomer) {

      await upsertCustomerProfileFromPos(result.license, body.cloudCustomer);

    }



    reply.code(result.httpStatus);

    return {

      ok: true,

      device: {

        id: result.device.id,

        name: result.device.name,

        type: result.device.type,

        status: result.device.status,

        licenseId: result.device.licenseId,

        customerId: result.device.customerId,

        lastHeartbeatAt: result.device.lastHeartbeatAt,

        createdAt: result.device.createdAt,

      },

      license: {

        id: result.license.id,

        key: result.license.key,

        plan: result.license.plan,

        status: result.license.status,

        maxDevices: result.license.maxDevices,

        validFrom: result.license.validFrom,

        validUntil: result.license.validUntil,

        customerId: result.license.customerId,

      },

    };

  });



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



      if (!isUuid(body.deviceId)) {

        reply.code(400);

        return {

          ok: false,

          reason: "invalid_device_id",

          message: "deviceId must be a UUID returned by /devices/bind",

        };

      }



      const auth = await authenticateDeviceHeartbeat(body.deviceId);



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

}


