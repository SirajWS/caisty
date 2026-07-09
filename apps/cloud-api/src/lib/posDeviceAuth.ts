import { and, eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import { licenses } from "../db/schema/licenses.js";
import {
  DEVICE_RELEASED_STATUS,
  findDeviceById,
} from "./deviceLifecycleService.js";

export type PosDeviceAuthContext = {
  orgId: string;
  customerId: string | null;
  deviceId: string;
  licenseId: string;
};

export type PosDeviceAuthError =
  | "invalid_request"
  | "invalid_license"
  | "device_not_bound"
  | "device_released"
  | "device_not_found";

export type PosDeviceAuthResult =
  | { ok: true; context: PosDeviceAuthContext }
  | { ok: false; error: PosDeviceAuthError; statusCode: 400 | 403 | 404 };

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

  if (device.status === DEVICE_RELEASED_STATUS || !device.licenseId) {
    return { ok: false, error: "device_released", statusCode: 403 };
  }

  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.key, licenseKey))
    .limit(1);

  if (!license || license.status !== "active") {
    return { ok: false, error: "invalid_license", statusCode: 403 };
  }

  if (String(device.licenseId) !== String(license.id)) {
    return { ok: false, error: "device_not_bound", statusCode: 403 };
  }

  return {
    ok: true,
    context: {
      orgId: device.orgId,
      customerId: device.customerId ?? license.customerId ?? null,
      deviceId: device.id,
      licenseId: license.id,
    },
  };
}
