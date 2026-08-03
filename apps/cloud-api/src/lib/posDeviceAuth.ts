import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import { licenses } from "../db/schema/licenses.js";
import {
  evaluateDevicePosAccess,
  type DeviceAccessDenialCode,
} from "./deviceAccessPolicy.js";
import {
  formatDeviceAccessDenial,
  httpStatusForDeviceAccessCode,
} from "./deviceAccessResponse.js";
import { findDeviceById } from "./deviceLifecycleService.js";

export type PosDeviceAuthContext = {
  orgId: string;
  customerId: string | null;
  deviceId: string;
  licenseId: string;
};

export type PosDeviceAuthError =
  | "invalid_request"
  | "invalid_license"
  | "device_not_found";

export type PosDeviceAuthPolicyDenial = {
  ok: false;
  code: DeviceAccessDenialCode;
  message: string;
  statusCode: 403;
};

export type PosDeviceAuthResult =
  | { ok: true; context: PosDeviceAuthContext }
  | { ok: false; error: PosDeviceAuthError; statusCode: 400 | 403 | 404 }
  | PosDeviceAuthPolicyDenial;

export function policyDenialToAuthResult(denial: {
  code: DeviceAccessDenialCode;
  message: string;
}): PosDeviceAuthPolicyDenial {
  return {
    ok: false,
    code: denial.code,
    message: denial.message,
    statusCode: httpStatusForDeviceAccessCode(denial.code),
  };
}

export async function authenticatePosDevice(input: {
  deviceId?: string;
  licenseKey?: string;
}): Promise<PosDeviceAuthResult> {
  const deviceId = input.deviceId?.trim();
  const licenseKey = input.licenseKey?.trim();

  if (!deviceId || !licenseKey) {
    return {
      ok: false,
      error: "invalid_request",
      statusCode: 400,
    };
  }

  const device = await findDeviceById(deviceId);

  if (!device) {
    return { ok: false, error: "device_not_found", statusCode: 404 };
  }

  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.key, licenseKey))
    .limit(1);

  if (!license || license.status !== "active") {
    return { ok: false, error: "invalid_license", statusCode: 403 };
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
    return policyDenialToAuthResult(access);
  }

  return {
    ok: true,
    context: {
      orgId: String(device.orgId),
      customerId: device.customerId ?? license.customerId ?? null,
      deviceId: device.id,
      licenseId: license.id,
    },
  };
}

/**
 * Heartbeat auth: deviceId only (legacy). Loads license from device.licenseId for active devices.
 * Never upgrades device status — caller updates timestamps only.
 */
export async function authenticateDeviceHeartbeat(
  deviceId: string,
): Promise<PosDeviceAuthResult> {
  const device = await findDeviceById(deviceId);

  if (!device) {
    return { ok: false, error: "device_not_found", statusCode: 404 };
  }

  if (device.status !== "active" || !device.licenseId?.trim()) {
    const access = evaluateDevicePosAccess({
      device: {
        orgId: String(device.orgId),
        status: device.status,
        licenseId: device.licenseId,
      },
      license: {
        id: device.licenseId ?? "",
        orgId: String(device.orgId),
      },
    });
    if (!access.allowed) {
      return policyDenialToAuthResult(access);
    }
  }

  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.id, device.licenseId!))
    .limit(1);

  if (!license || license.status !== "active") {
    return { ok: false, error: "invalid_license", statusCode: 403 };
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
    return policyDenialToAuthResult(access);
  }

  return {
    ok: true,
    context: {
      orgId: String(device.orgId),
      customerId: device.customerId ?? license.customerId ?? null,
      deviceId: device.id,
      licenseId: license.id,
    },
  };
}

export function formatPosDeviceAuthFailure(
  result: Exclude<PosDeviceAuthResult, { ok: true }>,
) {
  if ("code" in result && result.ok === false && "message" in result) {
    return formatDeviceAccessDenial({
      code: result.code,
      message: result.message,
    });
  }

  if (result.error === "device_not_found") {
    return {
      ok: false as const,
      reason: "device_not_found",
      message: "Device not found.",
    };
  }

  if (result.error === "invalid_request") {
    return {
      ok: false as const,
      reason: "invalid_request",
      message: "deviceId and licenseKey are required.",
    };
  }

  if (result.error === "invalid_license") {
    return {
      ok: false as const,
      error: "invalid_license",
    };
  }

  return { ok: false as const, error: result.error };
}
