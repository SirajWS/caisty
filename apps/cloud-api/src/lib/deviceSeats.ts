import { eq, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import { licenses } from "../db/schema/licenses.js";

/** Count devices currently bound to a license (occupying a seat). */
export async function countBoundDevicesForLicense(
  licenseId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(devices)
    .where(eq(devices.licenseId, licenseId));

  return Number(row?.value ?? 0);
}

export async function getLicenseSeatSummary(licenseId: string): Promise<{
  used: number;
  limit: number;
}> {
  const used = await countBoundDevicesForLicense(licenseId);
  const [license] = await db
    .select({ maxDevices: licenses.maxDevices })
    .from(licenses)
    .where(eq(licenses.id, licenseId))
    .limit(1);

  return {
    used,
    limit: license?.maxDevices ?? 1,
  };
}
