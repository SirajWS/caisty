import { and, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import { licenses } from "../db/schema/licenses.js";
import { seatLimitForApi } from "./deviceLimits.js";
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

export type LicenseSeatSummary = {
  used: number;
  /** null = unlimited */
  limit: number | null;
  unlimitedDevices: boolean;
};

/** Occupying rows: active/blocked, assigned, not archived. */
export function occupyingSeatWhere(licenseId?: string) {
  const parts = [
    inArray(devices.status, [...DEVICE_SEAT_CONSUMING_STATUSES]),
    isNull(devices.archivedAt),
  ];
  if (licenseId) {
    parts.unshift(eq(devices.licenseId, licenseId));
  }
  return and(...parts);
}

export function licenseSeatPayload(
  maxDevices: number | null | undefined,
  used: number,
): {
  devicesCount: number;
  seatSummary: LicenseSeatSummary;
} {
  const seat = seatLimitForApi(maxDevices);
  return {
    devicesCount: used,
    seatSummary: {
      used,
      limit: seat.limit,
      unlimitedDevices: seat.unlimitedDevices,
    },
  };
}

/** Count devices currently occupying a license seat (active or blocked with licenseId). */
export async function countBoundDevicesForLicense(
  licenseId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(devices)
    .where(occupyingSeatWhere(licenseId));

  return Number(row?.value ?? 0);
}

export async function countOccupiedSeatsByLicenseIds(
  licenseIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (licenseIds.length === 0) return map;

  const rows = await db
    .select({
      licenseId: devices.licenseId,
      count: sql<number>`count(*)::int`,
    })
    .from(devices)
    .where(
      and(
        inArray(devices.licenseId, licenseIds),
        inArray(devices.status, [...DEVICE_SEAT_CONSUMING_STATUSES]),
        isNull(devices.archivedAt),
      ),
    )
    .groupBy(devices.licenseId);

  for (const row of rows) {
    if (row.licenseId) {
      map.set(String(row.licenseId), Number(row.count ?? 0));
    }
  }
  return map;
}

export async function getLicenseSeatSummary(
  licenseId: string,
): Promise<LicenseSeatSummary> {
  const used = await countBoundDevicesForLicense(licenseId);
  const [license] = await db
    .select({ maxDevices: licenses.maxDevices })
    .from(licenses)
    .where(eq(licenses.id, licenseId))
    .limit(1);

  return licenseSeatPayload(license?.maxDevices, used).seatSummary;
}
