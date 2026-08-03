import { and, eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import { licenses } from "../db/schema/licenses.js";
import { licenseEvents } from "../db/schema/licenseEvents.js";
import { DEVICE_STATUS } from "./deviceAccessPolicy.js";
import { DEVICE_RELEASED_STATUS } from "./deviceLifecycleService.js";

export type BindDeviceInput = {
  licenseKey: string;
  deviceName: string;
  deviceType?: string;
  fingerprint?: string;
};

export type BindDeviceSuccessActive = {
  kind: "active";
  httpStatus: 200 | 201;
  created: boolean;
  device: typeof devices.$inferSelect;
  license: typeof licenses.$inferSelect;
};

export type BindDeviceSuccessPending = {
  kind: "pending";
  httpStatus: 202;
  created: boolean;
  device: typeof devices.$inferSelect;
};

export type BindDeviceError = {
  kind: "error";
  httpStatus: number;
  reason: string;
  message: string;
  devices?: {
    used: number;
    limit: number | null;
    unlimitedDevices: boolean;
  };
};

export type BindDeviceResult =
  | BindDeviceSuccessActive
  | BindDeviceSuccessPending
  | BindDeviceError;

function tenantScope(license: typeof licenses.$inferSelect) {
  return {
    orgId: String(license.orgId),
    customerId: license.customerId ? String(license.customerId) : null,
  };
}

function isLicenseCurrentlyValid(license: typeof licenses.$inferSelect): boolean {
  if (license.status !== "active") return false;
  const now = Date.now();
  if (license.validFrom && license.validFrom.getTime() > now) return false;
  if (license.validUntil && license.validUntil.getTime() < now) return false;
  return true;
}

async function findLicenseByKey(key: string) {
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.key, key))
    .limit(1);
  return license ?? null;
}

/** Tenant-scoped fingerprint lookup — never crosses customer/org boundaries. */
export async function findDevicesByFingerprintInTenant(input: {
  orgId: string;
  customerId: string | null;
  fingerprint: string;
}): Promise<(typeof devices.$inferSelect)[]> {
  if (!input.customerId) return [];

  return db
    .select()
    .from(devices)
    .where(
      and(
        eq(devices.orgId, input.orgId as typeof devices.$inferSelect.orgId),
        eq(devices.customerId, input.customerId as typeof devices.$inferSelect.customerId),
        eq(devices.fingerprint, input.fingerprint),
      ),
    );
}

function pendingLifecycleReset() {
  return {
    approvedAt: null,
    blockedAt: null,
    rejectedAt: null,
    releasedAt: null,
  };
}

function buildPendingValues(
  license: typeof licenses.$inferSelect,
  input: BindDeviceInput,
  now: Date,
): typeof devices.$inferInsert {
  return {
    orgId: license.orgId as typeof devices.$inferInsert.orgId,
    customerId: (license.customerId ?? null) as typeof devices.$inferInsert.customerId,
    name: input.deviceName,
    type: input.deviceType ?? "pos",
    status: DEVICE_STATUS.PENDING_APPROVAL,
    licenseId: null,
    pendingLicenseId: license.id,
    fingerprint: input.fingerprint ?? null,
    lastHeartbeatAt: null,
    lastSeenAt: now,
    ...pendingLifecycleReset(),
  };
}

async function insertPendingDevice(
  license: typeof licenses.$inferSelect,
  input: BindDeviceInput,
  now: Date,
): Promise<typeof devices.$inferSelect> {
  const inserted = await db
    .insert(devices)
    .values(buildPendingValues(license, input, now) as typeof devices.$inferInsert)
    .returning();

  const device = inserted[0];

  await db.insert(licenseEvents).values({
    orgId: String(license.orgId),
    licenseId: license.id,
    type: "device_pending_approval",
    metadata: {
      deviceId: device.id,
      deviceName: device.name,
      fingerprint: device.fingerprint,
    },
  });

  return device;
}

async function updatePendingDevice(
  existing: typeof devices.$inferSelect,
  input: BindDeviceInput,
  now: Date,
): Promise<typeof devices.$inferSelect> {
  const [updated] = await db
    .update(devices)
    .set({
      name: input.deviceName,
      type: input.deviceType ?? existing.type,
      lastSeenAt: now,
      ...pendingLifecycleReset(),
    } as typeof devices.$inferInsert)
    .where(eq(devices.id, existing.id))
    .returning();

  return updated ?? existing;
}

async function touchActiveDevice(
  existing: typeof devices.$inferSelect,
  input: BindDeviceInput,
  now: Date,
): Promise<typeof devices.$inferSelect> {
  const [updated] = await db
    .update(devices)
    .set({
      name: input.deviceName,
      type: input.deviceType ?? existing.type,
      lastHeartbeatAt: now,
      lastSeenAt: now,
    } as typeof devices.$inferInsert)
    .where(eq(devices.id, existing.id))
    .returning();

  return updated ?? existing;
}

/**
 * Phase 2 bind: new/rebind requests become pending_approval; existing active devices stay active.
 * Released fingerprints get a new device row so old deviceId credentials remain released.
 */
export async function bindDeviceRequest(
  input: BindDeviceInput,
): Promise<BindDeviceResult> {
  const license = await findLicenseByKey(input.licenseKey.trim());

  if (!license || !isLicenseCurrentlyValid(license)) {
    return {
      kind: "error",
      httpStatus: 200,
      reason: "invalid_or_expired",
      message: "License is invalid, revoked or expired.",
    };
  }

  const now = new Date();
  const scope = tenantScope(license);
  const fingerprint = input.fingerprint?.trim();

  if (fingerprint && scope.customerId) {
    const matches = await findDevicesByFingerprintInTenant({
      orgId: scope.orgId,
      customerId: scope.customerId,
      fingerprint,
    });

    const activeForLicense = matches.find(
      (row) =>
        row.status === DEVICE_STATUS.ACTIVE &&
        row.licenseId != null &&
        String(row.licenseId) === String(license.id),
    );

    if (activeForLicense) {
      const device = await touchActiveDevice(activeForLicense, input, now);
      return {
        kind: "active",
        httpStatus: 200,
        created: false,
        device,
        license,
      };
    }

    const activeOtherLicense = matches.find(
      (row) =>
        row.status === DEVICE_STATUS.ACTIVE &&
        row.licenseId != null &&
        String(row.licenseId) !== String(license.id),
    );

    if (activeOtherLicense) {
      return {
        kind: "error",
        httpStatus: 403,
        reason: "device_license_mismatch",
        message: "Device is already active on a different license.",
      };
    }

    const pendingForLicense = matches.find(
      (row) =>
        row.status === DEVICE_STATUS.PENDING_APPROVAL &&
        row.pendingLicenseId != null &&
        String(row.pendingLicenseId) === String(license.id),
    );

    if (pendingForLicense) {
      const device = await updatePendingDevice(pendingForLicense, input, now);
      return {
        kind: "pending",
        httpStatus: 202,
        created: false,
        device,
      };
    }

    // released / blocked / rejected / pending-other-license → new row (old credentials stay as-is)
  }

  const device = await insertPendingDevice(license, input, now);
  return {
    kind: "pending",
    httpStatus: 202,
    created: true,
    device,
  };
}

export { isLicenseCurrentlyValid, findLicenseByKey, DEVICE_RELEASED_STATUS };
