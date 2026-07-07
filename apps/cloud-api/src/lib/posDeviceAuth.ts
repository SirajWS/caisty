import { and, eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import { licenses } from "../db/schema/licenses.js";

export type PosDeviceAuthContext = {
  orgId: string;
  customerId: string | null;
  deviceId: string;
  licenseId: string;
};

export type PosDeviceAuthError =
  | "invalid_request"
  | "invalid_license"
  | "device_not_bound";

export type PosDeviceAuthResult =
  | { ok: true; context: PosDeviceAuthContext }
  | { ok: false; error: PosDeviceAuthError; statusCode: 400 | 403 };

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

  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.key, licenseKey))
    .limit(1);

  if (!license || license.status !== "active") {
    return { ok: false, error: "invalid_license", statusCode: 403 };
  }

  const [device] = await db
    .select()
    .from(devices)
    .where(and(eq(devices.id, deviceId), eq(devices.licenseId, license.id)))
    .limit(1);

  if (!device) {
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
