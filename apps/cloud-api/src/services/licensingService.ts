// apps/api/src/services/licensingService.ts

import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { licenses } from "../db/schema/licenses";
import { devices } from "../db/schema/devices";
import {
  LICENSE_PLANS,
  type LicensePlanId,
} from "../config/licensePlans";
import { OFFLINE_GRACE_DAYS } from "../config/license";

export type LicenseErrorCode =
  | "NOT_FOUND"
  | "EXPIRED"
  | "BLOCKED"
  | "INACTIVE"
  | "DEVICE_MISMATCH";

export interface LicenseCore {
  id: string;
  key: string;
  plan: string;
  status: string;
  maxDevices: number;
  validFrom: Date | null;
  validUntil: Date | null;
  createdAt: Date | null;
}

export interface DeviceCore {
  id: string;
  name: string;
  type: string;
  status: string;
  lastHeartbeatAt: Date | null;
  lastSeenAt: Date | null;
}

export interface VerifyLicenseInput {
  licenseKey: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
}

export interface VerifyLicenseResult {
  ok: boolean;
  errorCode?: LicenseErrorCode;
  message?: string;
  checkedAt: Date;
  offlineGraceDays: number;
  license?: LicenseCore;
  devices?: {
    used: number;
    limit: number;
  };
  device?: DeviceCore | null;
}

/**
 * Zentrale Business-Logik zur Lizenzprüfung für den POS.
 * Wird von /licenses/verify (und später ggf. anderen Routen) verwendet.
 */
export async function verifyLicenseForPos(
  input: VerifyLicenseInput,
): Promise<VerifyLicenseResult> {
  const now = new Date();
  const { licenseKey, deviceId } = input;

  // 1) Lizenz anhand des Keys finden
  const rows = await db
    .select()
    .from(licenses)
    .where(eq(licenses.key, licenseKey))
    .limit(1);

  const lic = rows[0];

  if (!lic) {
    return {
      ok: false,
      errorCode: "NOT_FOUND",
      message: "License key not found.",
      checkedAt: now,
      offlineGraceDays: OFFLINE_GRACE_DAYS,
    };
  }

  // 2) Hard-Block: revoked / blocked
  if (lic.status === "revoked" || lic.status === "blocked") {
    return {
      ok: false,
      errorCode: "BLOCKED",
      message: "License has been revoked or blocked in Cloud.",
      checkedAt: now,
      offlineGraceDays: OFFLINE_GRACE_DAYS,
      license: mapLicenseCore(lic),
    };
  }

  // 3) Zeitraum prüfen
  const notYetValid =
    lic.validFrom && lic.validFrom.getTime() > now.getTime();
  const expired =
    lic.validUntil && lic.validUntil.getTime() < now.getTime();

  if (expired) {
    // Status in DB nachziehen, falls noch nicht gesetzt
    if (lic.status !== "expired") {
      await db
        .update(licenses)
        .set({
          status: "expired",
          updatedAt: now,
        } as any)
        .where(eq(licenses.id, lic.id));
    }

    return {
      ok: false,
      errorCode: "EXPIRED",
      message: "License is expired.",
      checkedAt: now,
      offlineGraceDays: OFFLINE_GRACE_DAYS,
      license: mapLicenseCore({ ...lic, status: "expired" }),
    };
  }

  if (notYetValid || lic.status !== "active") {
    return {
      ok: false,
      errorCode: "INACTIVE",
      message: "License is not active for the current period.",
      checkedAt: now,
      offlineGraceDays: OFFLINE_GRACE_DAYS,
      license: mapLicenseCore(lic),
    };
  }

  // 4) Devices für diese Lizenz laden (Seats)
  const devicesForLicense = await db.query.devices.findMany({
    where: eq(devices.licenseId, lic.id),
  });

  const usedSeats = devicesForLicense.length;

  const planId = (lic.plan || "starter") as LicensePlanId;
  const planConfig = LICENSE_PLANS[planId];
  const maxDevices =
    lic.maxDevices ?? planConfig?.maxDevices ?? 1;

  // Optional: Device-Check (z.B. Device-Mismatch)
  let currentDeviceRow: (typeof devices.$inferSelect) | undefined;

  if (deviceId) {
    currentDeviceRow = devicesForLicense.find(
      (d) => String(d.id) === String(deviceId),
    );

    // wenn ein deviceId angegeben ist, aber unter dieser Lizenz nicht existiert
    if (!currentDeviceRow) {
      return {
        ok: false,
        errorCode: "DEVICE_MISMATCH",
        message:
          "Device is not bound to this license (device mismatch).",
        checkedAt: now,
        offlineGraceDays: OFFLINE_GRACE_DAYS,
        license: mapLicenseCore({ ...lic, maxDevices }),
        devices: {
          used: usedSeats,
          limit: maxDevices,
        },
      };
    }
  }

  return {
    ok: true,
    checkedAt: now,
    offlineGraceDays: OFFLINE_GRACE_DAYS,
    license: mapLicenseCore({ ...lic, maxDevices }),
    devices: {
      used: usedSeats,
      limit: maxDevices,
    },
    device: currentDeviceRow
      ? mapDeviceCore(currentDeviceRow)
      : null,
  };
}

function mapLicenseCore(row: typeof licenses.$inferSelect & {
  maxDevices?: number | null;
}): LicenseCore {
  return {
    id: String(row.id),
    key: String(row.key),
    plan: String(row.plan),
    status: String(row.status),
    maxDevices: row.maxDevices ?? 1,
    validFrom: row.validFrom ?? null,
    validUntil: row.validUntil ?? null,
    createdAt: row.createdAt ?? null,
  };
}

function mapDeviceCore(
  row: typeof devices.$inferSelect,
): DeviceCore {
  return {
    id: String(row.id),
    name: String(row.name),
    type: String(row.type),
    status: String(row.status),
    lastHeartbeatAt: row.lastHeartbeatAt ?? null,
    lastSeenAt: row.lastSeenAt ?? null,
  };
}
