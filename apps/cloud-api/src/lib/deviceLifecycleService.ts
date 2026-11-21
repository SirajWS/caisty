import { DEVICE_STATUS } from "./deviceAccessPolicy.js";

import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import { licenseEvents } from "../db/schema/licenseEvents.js";
import { getLicenseSeatSummary } from "./deviceSeats.js";

export const DEVICE_RELEASED_STATUS = "released";

export type ReleaseDeviceActor =
  | { type: "portal_customer"; customerId: string; orgId: string }
  | { type: "admin"; adminUserId: string };

export type ReleaseDeviceErrorCode =
  | "not_found"
  | "forbidden"
  | "already_released"
  | "not_bound"
  | "invalid_transition";

export type ReleaseDeviceResult =
  | {
      ok: true;
      deviceId: string;
      customerId: string | null;
      licenseId: string | null;
      releasedAt: string;
      licenseDevices: { used: number; limit: number } | null;
    }
  | {
      ok: false;
      code: ReleaseDeviceErrorCode;
      message: string;
    };

export function isDeviceReleased(device: {
  status: string;
  licenseId: string | null;
}): boolean {
  return device.status === DEVICE_RELEASED_STATUS;
}

export async function findDeviceById(deviceId: string) {
  const [device] = await db
    .select()
    .from(devices)
    .where(eq(devices.id, deviceId))
    .limit(1);

  return device ?? null;
}

/**
 * Soft-release a POS device: clear license binding, mark as released, keep row + sales history.
 * Shared by Customer Portal and Cloud Admin.
 */
export async function releaseDevice(
  deviceId: string,
  actor: ReleaseDeviceActor,
): Promise<ReleaseDeviceResult> {
  const existing = await findDeviceById(deviceId);

  if (!existing) {
    return {
      ok: false,
      code: "not_found",
      message: "Device not found.",
    };
  }

  if (actor.type === "portal_customer") {
    if (
      existing.customerId !== actor.customerId ||
      String(existing.orgId) !== String(actor.orgId)
    ) {
      return {
        ok: false,
        code: "forbidden",
        message: "You do not have permission to release this device.",
      };
    }
  }

  if (existing.status === DEVICE_RELEASED_STATUS) {
    return {
      ok: false,
      code: "already_released",
      message: "Device is already released.",
    };
  }

  if (
    existing.status !== DEVICE_STATUS.ACTIVE &&
    existing.status !== DEVICE_STATUS.BLOCKED
  ) {
    return {
      ok: false,
      code: "invalid_transition",
      message: `Device cannot be released from status "${existing.status}".`,
    };
  }

  if (!existing.licenseId) {
    return {
      ok: false,
      code: "not_bound",
      message: "Device is not bound to a license.",
    };
  }

  const previousLicenseId = existing.licenseId;
  const now = new Date();

  await db
    .update(devices)
    .set({
      licenseId: null,
      pendingLicenseId: null,
      status: DEVICE_RELEASED_STATUS,
      releasedAt: now,
      blockedAt: null,
    } as typeof devices.$inferInsert)
    .where(eq(devices.id, existing.id));

  await db.insert(licenseEvents).values({
    orgId: String(existing.orgId),
    licenseId: previousLicenseId,
    type: "device_released",
    metadata: {
      deviceId: existing.id,
      deviceName: existing.name,
      actorType: actor.type,
      actorId:
        actor.type === "portal_customer"
          ? actor.customerId
          : actor.adminUserId,
    },
  });

  const licenseDevices = await getLicenseSeatSummary(previousLicenseId);

  return {
    ok: true,
    deviceId: existing.id,
    customerId: existing.customerId,
    licenseId: previousLicenseId,
    releasedAt: now.toISOString(),
    licenseDevices,
  };
}

export type ArchiveDeviceResult =
  | {
      ok: true;
      deviceId: string;
      archivedAt: string;
      alreadyArchived: boolean;
      stationCode: string | null;
    }
  | {
      ok: false;
      code: "not_found" | "bound" | "invalid_transition";
      message: string;
    };

function isArchived(device: { archivedAt?: Date | string | null }): boolean {
  return Boolean(device.archivedAt);
}

/**
 * Soft-archive a device from Super-Admin management lists.
 * Keeps the row, station code, receipts and license history.
 */
export async function archiveDevice(
  deviceId: string,
): Promise<ArchiveDeviceResult> {
  const existing = await findDeviceById(deviceId);

  if (!existing) {
    return {
      ok: false,
      code: "not_found",
      message: "Device not found.",
    };
  }

  if (isArchived(existing)) {
    return {
      ok: true,
      deviceId: existing.id,
      archivedAt:
        existing.archivedAt instanceof Date
          ? existing.archivedAt.toISOString()
          : String(existing.archivedAt),
      alreadyArchived: true,
      stationCode: existing.stationCode ?? null,
    };
  }

  if (existing.licenseId) {
    return {
      ok: false,
      code: "bound",
      message:
        "Release the device from its license before removing it from management views.",
    };
  }

  if (existing.status === DEVICE_STATUS.PENDING_APPROVAL) {
    return {
      ok: false,
      code: "invalid_transition",
      message: "A device waiting for approval cannot be archived.",
    };
  }

  const now = new Date();
  await db
    .update(devices)
    .set({
      archivedAt: now,
    } as typeof devices.$inferInsert)
    .where(eq(devices.id, existing.id));

  return {
    ok: true,
    deviceId: existing.id,
    archivedAt: now.toISOString(),
    alreadyArchived: false,
    stationCode: existing.stationCode ?? null,
  };
}

export type UnarchiveDeviceResult =
  | {
      ok: true;
      deviceId: string;
      restored: boolean;
      stationCode: string | null;
    }
  | {
      ok: false;
      code: "not_found";
      message: string;
    };

export async function unarchiveDevice(
  deviceId: string,
): Promise<UnarchiveDeviceResult> {
  const existing = await findDeviceById(deviceId);

  if (!existing) {
    return {
      ok: false,
      code: "not_found",
      message: "Device not found.",
    };
  }

  if (!isArchived(existing)) {
    return {
      ok: true,
      deviceId: existing.id,
      restored: false,
      stationCode: existing.stationCode ?? null,
    };
  }

  await db
    .update(devices)
    .set({
      archivedAt: null,
    } as typeof devices.$inferInsert)
    .where(eq(devices.id, existing.id));

  return {
    ok: true,
    deviceId: existing.id,
    restored: true,
    stationCode: existing.stationCode ?? null,
  };
}
