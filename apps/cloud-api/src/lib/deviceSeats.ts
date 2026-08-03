import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import { licenses } from "../db/schema/licenses.js";
import { isUnlimitedDeviceLimit } from "./deviceLimits.js";
import {
  DEVICE_SEAT_CONSUMING_STATUSES,
  countSeatOccupyingDevicesForLicense,
  deviceOccupiesSeat,
} from "./deviceSeatPolicy.js";

export {
  DEVICE_SEAT_CONSUMING_STATUSES,
  countSeatOccupyingDevicesForLicense,
  deviceOccupiesSeat,
};

/** Count devices currently occupying a license seat (active or blocked with licenseId). */
export async function countBoundDevicesForLicense(
  licenseId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(devices)
    .where(
      and(
        eq(devices.licenseId, licenseId),
        inArray(devices.status, [...DEVICE_SEAT_CONSUMING_STATUSES]),
      ),
    );

  return Number(row?.value ?? 0);
}

export async function getLicenseSeatSummary(licenseId: string): Promise<{
  used: number;
  /** null = unlimited */
  limit: number | null;
  unlimitedDevices: boolean;
}> {
  const used = await countBoundDevicesForLicense(licenseId);
  const [license] = await db
    .select({ maxDevices: licenses.maxDevices })
    .from(licenses)
    .where(eq(licenses.id, licenseId))
    .limit(1);

  const maxDevices = license?.maxDevices;
  if (isUnlimitedDeviceLimit(maxDevices)) {
    return { used, limit: null, unlimitedDevices: true };
  }
  const limit =
    typeof maxDevices === "number" && maxDevices > 0 ? maxDevices : 1;
  return { used, limit, unlimitedDevices: false };
}
