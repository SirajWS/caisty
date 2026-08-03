import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import { licenses } from "../db/schema/licenses.js";
import { licenseEvents } from "../db/schema/licenseEvents.js";
import { DEVICE_STATUS } from "./deviceAccessPolicy.js";
import { canAcceptAdditionalDevice, isUnlimitedDeviceLimit } from "./deviceLimits.js";
import {
  DEVICE_SEAT_CONSUMING_STATUSES,
  deviceOccupiesSeat,
} from "./deviceSeatPolicy.js";
import {
  getLicenseSeatSummary,
} from "./deviceSeats.js";
import {
  DEVICE_RELEASED_STATUS,
  findDeviceById,
  releaseDevice,
  type ReleaseDeviceResult,
} from "./deviceLifecycleService.js";

export type PortalDeviceActor = {
  customerId: string;
  orgId: string;
};

export type PortalDeviceErrorCode =
  | "DEVICE_NOT_FOUND"
  | "DEVICE_INVALID_TRANSITION"
  | "DEVICE_LIMIT_REACHED"
  | "DEVICE_LICENSE_INVALID"
  | "DEVICE_LICENSE_MISMATCH"
  | "DEVICE_ORG_MISMATCH";

export type PortalDeviceFailure = {
  ok: false;
  code: PortalDeviceErrorCode;
  message: string;
  maxDevices?: number | null;
  usedSeats?: number;
  remainingSeats?: number;
};

export type PortalDeviceAllowedAction =
  | "approve"
  | "reject"
  | "block"
  | "unblock"
  | "release";

type DeviceRow = typeof devices.$inferSelect;
type LicenseRow = typeof licenses.$inferSelect;

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function failure(
  code: PortalDeviceErrorCode,
  message: string,
  extra?: Pick<
    PortalDeviceFailure,
    "maxDevices" | "usedSeats" | "remainingSeats"
  >,
): PortalDeviceFailure {
  return { ok: false, code, message, ...extra };
}

function tenantMatchesDevice(
  device: DeviceRow,
  actor: PortalDeviceActor,
): boolean {
  return (
    device.customerId === actor.customerId &&
    String(device.orgId) === String(actor.orgId)
  );
}

/** Foreign or missing devices resolve as not found — no tenant leakage. */
function deviceNotFound(): PortalDeviceFailure {
  return failure("DEVICE_NOT_FOUND", "Device not found.");
}

function isLicenseUsable(license: LicenseRow): boolean {
  if (license.status !== "active") return false;
  const now = Date.now();
  if (license.validFrom && license.validFrom.getTime() > now) return false;
  if (license.validUntil && license.validUntil.getTime() < now) return false;
  return true;
}

function licenseBelongsToActor(
  license: LicenseRow,
  actor: PortalDeviceActor,
): boolean {
  return (
    license.customerId === actor.customerId &&
    String(license.orgId) === String(actor.orgId)
  );
}

export function allowedActionsForStatus(
  status: string,
): PortalDeviceAllowedAction[] {
  switch (status) {
    case DEVICE_STATUS.PENDING_APPROVAL:
      return ["approve", "reject"];
    case DEVICE_STATUS.ACTIVE:
      return ["block", "release"];
    case DEVICE_STATUS.BLOCKED:
      return ["unblock", "release"];
    default:
      return [];
  }
}

export function maskFingerprint(fingerprint: string | null): string | null {
  if (!fingerprint?.trim()) return null;
  const fp = fingerprint.trim();
  if (fp.length <= 8) return "****";
  return `${fp.slice(0, 4)}…${fp.slice(-4)}`;
}

function connectivityStatus(
  lastSeenAt: Date | null,
  lastHeartbeatAt: Date | null,
): "online" | "offline" | "never_seen" {
  const now = Date.now();
  const seen = lastSeenAt ? lastSeenAt.getTime() : null;
  const beat = lastHeartbeatAt ? lastHeartbeatAt.getTime() : null;
  const latest = Math.max(seen ?? 0, beat ?? 0);
  if (!latest) return "never_seen";
  return now - latest <= ONLINE_WINDOW_MS ? "online" : "offline";
}

function pickPrimaryLicense(licenseRows: LicenseRow[]): LicenseRow | null {
  if (!licenseRows.length) return null;
  const actives = licenseRows.filter((l) => l.status === "active");
  const pool = actives.length ? actives : licenseRows;
  const sorted = [...pool].sort((a, b) => {
    const ta = a.validUntil ? a.validUntil.getTime() : 0;
    const tb = b.validUntil ? b.validUntil.getTime() : 0;
    return tb - ta;
  });
  return sorted[0] ?? null;
}

async function countBoundDevicesForLicenseInTx(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  licenseId: string,
): Promise<number> {
  const [row] = await tx
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

function isPortalFailure(
  value: LicenseRow | PortalDeviceFailure,
): value is PortalDeviceFailure {
  return "ok" in value && value.ok === false;
}

async function loadLicenseForActor(
  licenseId: string,
  actor: PortalDeviceActor,
): Promise<LicenseRow | PortalDeviceFailure> {
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.id, licenseId))
    .limit(1);

  if (!license || !licenseBelongsToActor(license, actor)) {
    return failure(
      "DEVICE_LICENSE_INVALID",
      "Target license is not available for this account.",
    );
  }

  if (!isLicenseUsable(license)) {
    return failure(
      "DEVICE_LICENSE_INVALID",
      "Target license is not valid or has expired.",
    );
  }

  return license;
}

async function insertDeviceLifecycleEvent(input: {
  orgId: string;
  licenseId: string;
  type: string;
  deviceId: string;
  deviceName: string;
  customerId: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(licenseEvents).values({
    orgId: input.orgId,
    licenseId: input.licenseId,
    type: input.type,
    metadata: {
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      actorType: "portal_customer",
      actorId: input.customerId,
      ...input.metadata,
    },
  });
}

export type PortalDeviceManagementDevice = {
  id: string;
  name: string;
  type: string;
  lifecycleStatus: string;
  connectivityStatus: "online" | "offline" | "never_seen";
  licenseId: string | null;
  pendingLicenseId: string | null;
  licensePlan: string | null;
  fingerprintMasked: string | null;
  appVersion: string | null;
  createdAt: string;
  approvedAt: string | null;
  blockedAt: string | null;
  rejectedAt: string | null;
  releasedAt: string | null;
  allowedActions: PortalDeviceAllowedAction[];
};

export type PortalDeviceManagementResult = {
  ok: true;
  summary: {
    plan: string | null;
    maxDevices: number | null;
    unlimitedDevices: boolean;
    usedSeats: number;
    activeCount: number;
    blockedCount: number;
    pendingCount: number;
    rejectedCount: number;
    releasedCount: number;
    remainingSeats: number;
    overLimit: boolean;
  };
  devices: PortalDeviceManagementDevice[];
};

export async function getPortalDeviceManagement(
  actor: PortalDeviceActor,
): Promise<PortalDeviceManagementResult> {
  const deviceRows = await db
    .select()
    .from(devices)
    .where(
      and(
        eq(devices.customerId, actor.customerId),
        eq(devices.orgId, actor.orgId),
      ),
    )
    .orderBy(desc(devices.createdAt));

  const licenseRows = await db
    .select()
    .from(licenses)
    .where(
      and(
        eq(licenses.customerId, actor.customerId),
        eq(licenses.orgId, actor.orgId),
      ),
    );

  const licenseById = new Map(licenseRows.map((l) => [String(l.id), l]));
  const primary = pickPrimaryLicense(licenseRows);

  let usedSeats = 0;
  let maxDevices: number | null = null;
  let unlimitedDevices = false;
  let remainingSeats = 0;
  let overLimit = false;

  if (primary) {
    const seatSummary = await getLicenseSeatSummary(String(primary.id));
    usedSeats = seatSummary.used;
    maxDevices = seatSummary.limit;
    unlimitedDevices = seatSummary.unlimitedDevices;
    if (unlimitedDevices) {
      remainingSeats = Number.MAX_SAFE_INTEGER;
      overLimit = false;
    } else {
      const limit = maxDevices ?? 1;
      remainingSeats = Math.max(0, limit - usedSeats);
      overLimit = usedSeats > limit;
    }
  }

  let activeCount = 0;
  let blockedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;
  let releasedCount = 0;

  for (const row of deviceRows) {
    switch (row.status) {
      case DEVICE_STATUS.ACTIVE:
        activeCount += 1;
        break;
      case DEVICE_STATUS.BLOCKED:
        blockedCount += 1;
        break;
      case DEVICE_STATUS.PENDING_APPROVAL:
        pendingCount += 1;
        break;
      case DEVICE_STATUS.REJECTED:
        rejectedCount += 1;
        break;
      case DEVICE_STATUS.RELEASED:
        releasedCount += 1;
        break;
      default:
        break;
    }
  }

  const devicesDto: PortalDeviceManagementDevice[] = deviceRows.map((row) => {
    const boundLicense = row.licenseId
      ? licenseById.get(String(row.licenseId))
      : null;
    const pendingLicense = row.pendingLicenseId
      ? licenseById.get(String(row.pendingLicenseId))
      : null;
    const plan =
      boundLicense?.plan ?? pendingLicense?.plan ?? primary?.plan ?? null;

    return {
      id: row.id,
      name: row.name,
      type: row.type,
      lifecycleStatus: row.status,
      connectivityStatus: connectivityStatus(
        row.lastSeenAt,
        row.lastHeartbeatAt,
      ),
      licenseId: row.licenseId,
      pendingLicenseId: row.pendingLicenseId,
      licensePlan: plan ? String(plan) : null,
      fingerprintMasked: maskFingerprint(row.fingerprint),
      appVersion: row.appVersion ?? null,
      createdAt: row.createdAt.toISOString(),
      approvedAt: row.approvedAt?.toISOString() ?? null,
      blockedAt: row.blockedAt?.toISOString() ?? null,
      rejectedAt: row.rejectedAt?.toISOString() ?? null,
      releasedAt: row.releasedAt?.toISOString() ?? null,
      allowedActions: allowedActionsForStatus(row.status),
    };
  });

  return {
    ok: true,
    summary: {
      plan: primary?.plan ?? null,
      maxDevices,
      unlimitedDevices,
      usedSeats,
      activeCount,
      blockedCount,
      pendingCount,
      rejectedCount,
      releasedCount,
      remainingSeats: unlimitedDevices
        ? remainingSeats
        : Math.max(0, (maxDevices ?? 1) - usedSeats),
      overLimit,
    },
    devices: devicesDto,
  };
}

export type ApproveDeviceSuccess = {
  ok: true;
  deviceId: string;
  status: "active";
  licenseId: string;
  idempotent: boolean;
  seatSummary: {
    used: number;
    maxDevices: number | null;
    remainingSeats: number;
  };
};

export async function approvePortalDevice(
  deviceId: string,
  actor: PortalDeviceActor,
): Promise<ApproveDeviceSuccess | PortalDeviceFailure> {
  try {
    return await db.transaction(async (tx) => {
      const [device] = await tx
        .select()
        .from(devices)
        .where(eq(devices.id, deviceId))
        .for("update")
        .limit(1);

      if (!device || !tenantMatchesDevice(device, actor)) {
        return deviceNotFound();
      }

      if (device.status === DEVICE_STATUS.ACTIVE) {
        if (device.licenseId) {
          const used = await countBoundDevicesForLicenseInTx(
            tx,
            device.licenseId,
          );
          const seatSummary = await getLicenseSeatSummary(device.licenseId);
          const limit = seatSummary.unlimitedDevices
            ? null
            : (seatSummary.limit ?? 1);
          return {
            ok: true,
            deviceId: device.id,
            status: "active",
            licenseId: device.licenseId,
            idempotent: true,
            seatSummary: {
              used,
              maxDevices: limit,
              remainingSeats: seatSummary.unlimitedDevices
                ? Number.MAX_SAFE_INTEGER
                : Math.max(0, (limit ?? 1) - used),
            },
          };
        }
        return failure(
          "DEVICE_INVALID_TRANSITION",
          "Active device is not bound to a license.",
        );
      }

      if (device.status !== DEVICE_STATUS.PENDING_APPROVAL) {
        return failure(
          "DEVICE_INVALID_TRANSITION",
          `Device cannot be approved from status "${device.status}".`,
        );
      }

      if (device.licenseId) {
        return failure(
          "DEVICE_INVALID_TRANSITION",
          "Pending device already has an active license binding.",
        );
      }

      const pendingLicenseId = device.pendingLicenseId?.trim();
      if (!pendingLicenseId) {
        return failure(
          "DEVICE_LICENSE_INVALID",
          "Pending device has no target license.",
        );
      }

      const [license] = await tx
        .select()
        .from(licenses)
        .where(eq(licenses.id, pendingLicenseId))
        .for("update")
        .limit(1);

      if (!license || !licenseBelongsToActor(license, actor)) {
        return failure(
          "DEVICE_LICENSE_INVALID",
          "Target license is not available for this account.",
        );
      }

      if (!isLicenseUsable(license)) {
        return failure(
          "DEVICE_LICENSE_INVALID",
          "Target license is not valid or has expired.",
        );
      }

      if (String(license.orgId) !== String(device.orgId)) {
        return failure(
          "DEVICE_ORG_MISMATCH",
          "Device organization does not match the target license.",
        );
      }

      const usedSeats = await countBoundDevicesForLicenseInTx(
        tx,
        pendingLicenseId,
      );
      const maxDevices = license.maxDevices;
      const unlimited = isUnlimitedDeviceLimit(maxDevices);

      if (!canAcceptAdditionalDevice(usedSeats, maxDevices)) {
        const limit = unlimited ? null : Math.trunc(maxDevices ?? 1);
        return failure(
          "DEVICE_LIMIT_REACHED",
          "Device seat limit reached for this license.",
          {
            maxDevices: limit,
            usedSeats,
            remainingSeats: 0,
          },
        );
      }

      const now = new Date();
      const [updated] = await tx
        .update(devices)
        .set({
          status: DEVICE_STATUS.ACTIVE,
          licenseId: pendingLicenseId,
          pendingLicenseId: null,
          approvedAt: now,
          blockedAt: null,
          rejectedAt: null,
          releasedAt: null,
        } as typeof devices.$inferInsert)
        .where(
          and(
            eq(devices.id, device.id),
            eq(devices.status, DEVICE_STATUS.PENDING_APPROVAL),
          ),
        )
        .returning();

      if (!updated) {
        return failure(
          "DEVICE_INVALID_TRANSITION",
          "Device approval conflict — refresh and retry.",
        );
      }

      await tx.insert(licenseEvents).values({
        orgId: String(device.orgId),
        licenseId: pendingLicenseId,
        type: "device_approved",
        metadata: {
          deviceId: device.id,
          deviceName: device.name,
          actorType: "portal_customer",
          actorId: actor.customerId,
        },
      });

      const usedAfter = usedSeats + 1;
      const limitAfter = unlimited ? null : Math.trunc(maxDevices ?? 1);

      return {
        ok: true,
        deviceId: updated.id,
        status: "active",
        licenseId: pendingLicenseId,
        idempotent: false,
        seatSummary: {
          used: usedAfter,
          maxDevices: limitAfter,
          remainingSeats: unlimited
            ? Number.MAX_SAFE_INTEGER
            : Math.max(0, (limitAfter ?? 1) - usedAfter),
        },
      };
    });
  } catch (err) {
    console.error("approvePortalDevice failed:", err);
    throw err;
  }
}

export type SimpleDeviceMutationSuccess = {
  ok: true;
  deviceId: string;
  status: string;
};

export async function rejectPortalDevice(
  deviceId: string,
  actor: PortalDeviceActor,
): Promise<SimpleDeviceMutationSuccess | PortalDeviceFailure> {
  const existing = await findDeviceById(deviceId);
  if (!existing || !tenantMatchesDevice(existing, actor)) {
    return deviceNotFound();
  }

  if (existing.status !== DEVICE_STATUS.PENDING_APPROVAL) {
    return failure(
      "DEVICE_INVALID_TRANSITION",
      `Device cannot be rejected from status "${existing.status}".`,
    );
  }

  const now = new Date();
  const [updated] = await db
    .update(devices)
    .set({
      status: DEVICE_STATUS.REJECTED,
      licenseId: null,
      pendingLicenseId: null,
      rejectedAt: now,
      approvedAt: null,
      blockedAt: null,
      releasedAt: null,
    } as typeof devices.$inferInsert)
    .where(
      and(
        eq(devices.id, deviceId),
        eq(devices.status, DEVICE_STATUS.PENDING_APPROVAL),
      ),
    )
    .returning();

  if (!updated) {
    return failure(
      "DEVICE_INVALID_TRANSITION",
      "Device rejection conflict — refresh and retry.",
    );
  }

  if (existing.pendingLicenseId) {
    await insertDeviceLifecycleEvent({
      orgId: String(existing.orgId),
      licenseId: existing.pendingLicenseId,
      type: "device_rejected",
      deviceId: existing.id,
      deviceName: existing.name,
      customerId: actor.customerId,
    });
  }

  return { ok: true, deviceId: updated.id, status: DEVICE_STATUS.REJECTED };
}

export async function blockPortalDevice(
  deviceId: string,
  actor: PortalDeviceActor,
): Promise<SimpleDeviceMutationSuccess | PortalDeviceFailure> {
  const existing = await findDeviceById(deviceId);
  if (!existing || !tenantMatchesDevice(existing, actor)) {
    return deviceNotFound();
  }

  if (existing.status !== DEVICE_STATUS.ACTIVE) {
    return failure(
      "DEVICE_INVALID_TRANSITION",
      `Device cannot be blocked from status "${existing.status}".`,
    );
  }

  if (!existing.licenseId) {
    return failure(
      "DEVICE_INVALID_TRANSITION",
      "Active device is not bound to a license.",
    );
  }

  const licenseResult = await loadLicenseForActor(existing.licenseId, actor);
  if (isPortalFailure(licenseResult)) {
    return licenseResult;
  }

  const now = new Date();
  const [updated] = await db
    .update(devices)
    .set({
      status: DEVICE_STATUS.BLOCKED,
      pendingLicenseId: null,
      blockedAt: now,
    } as typeof devices.$inferInsert)
    .where(
      and(eq(devices.id, deviceId), eq(devices.status, DEVICE_STATUS.ACTIVE)),
    )
    .returning();

  if (!updated) {
    return failure(
      "DEVICE_INVALID_TRANSITION",
      "Device block conflict — refresh and retry.",
    );
  }

  await insertDeviceLifecycleEvent({
    orgId: String(existing.orgId),
    licenseId: existing.licenseId,
    type: "device_blocked",
    deviceId: existing.id,
    deviceName: existing.name,
    customerId: actor.customerId,
  });

  return { ok: true, deviceId: updated.id, status: DEVICE_STATUS.BLOCKED };
}

export async function unblockPortalDevice(
  deviceId: string,
  actor: PortalDeviceActor,
): Promise<SimpleDeviceMutationSuccess | PortalDeviceFailure> {
  const existing = await findDeviceById(deviceId);
  if (!existing || !tenantMatchesDevice(existing, actor)) {
    return deviceNotFound();
  }

  if (existing.status !== DEVICE_STATUS.BLOCKED) {
    return failure(
      "DEVICE_INVALID_TRANSITION",
      `Device cannot be unblocked from status "${existing.status}".`,
    );
  }

  if (!existing.licenseId) {
    return failure(
      "DEVICE_INVALID_TRANSITION",
      "Blocked device is not bound to a license.",
    );
  }

  const licenseResult = await loadLicenseForActor(existing.licenseId, actor);
  if (isPortalFailure(licenseResult)) {
    return licenseResult;
  }

  if (String(existing.orgId) !== String(licenseResult.orgId)) {
    return failure(
      "DEVICE_ORG_MISMATCH",
      "Device organization does not match the license.",
    );
  }

  const [updated] = await db
    .update(devices)
    .set({
      status: DEVICE_STATUS.ACTIVE,
      blockedAt: null,
    } as typeof devices.$inferInsert)
    .where(
      and(eq(devices.id, deviceId), eq(devices.status, DEVICE_STATUS.BLOCKED)),
    )
    .returning();

  if (!updated) {
    return failure(
      "DEVICE_INVALID_TRANSITION",
      "Device unblock conflict — refresh and retry.",
    );
  }

  await insertDeviceLifecycleEvent({
    orgId: String(existing.orgId),
    licenseId: existing.licenseId,
    type: "device_unblocked",
    deviceId: existing.id,
    deviceName: existing.name,
    customerId: actor.customerId,
  });

  return { ok: true, deviceId: updated.id, status: DEVICE_STATUS.ACTIVE };
}

export async function releasePortalDevice(
  deviceId: string,
  actor: PortalDeviceActor,
): Promise<ReleaseDeviceResult> {
  const existing = await findDeviceById(deviceId);
  if (!existing || !tenantMatchesDevice(existing, actor)) {
    return {
      ok: false,
      code: "not_found",
      message: "Device not found.",
    };
  }

  return releaseDevice(deviceId, {
    type: "portal_customer",
    customerId: actor.customerId,
    orgId: actor.orgId,
  });
}

/** Pure helper for tests — seat math from in-memory device rows. */
export function computeSeatSummaryFromDevices(
  deviceList: DeviceRow[],
  maxDevices: number | null,
): {
  usedSeats: number;
  remainingSeats: number;
  overLimit: boolean;
} {
  const usedSeats = deviceList.filter((d) => deviceOccupiesSeat(d)).length;
  if (isUnlimitedDeviceLimit(maxDevices)) {
    return {
      usedSeats,
      remainingSeats: Number.MAX_SAFE_INTEGER,
      overLimit: false,
    };
  }
  const limit = Math.trunc(maxDevices ?? 1);
  return {
    usedSeats,
    remainingSeats: Math.max(0, limit - usedSeats),
    overLimit: usedSeats > limit,
  };
}
