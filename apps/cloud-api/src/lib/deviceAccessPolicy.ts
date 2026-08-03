import { DEVICE_RELEASED_STATUS } from "./deviceLifecycleService.js";

/**
 * Supported device lifecycle statuses (target model).
 *
 * DB CHECK constraint deferred: legacy rows may only use "active" | "released" today,
 * but varchar(50) allows arbitrary values from older tooling. Validation lives here
 * until a full status audit confirms no other legitimate production values exist.
 */
export const DEVICE_STATUS = {
  PENDING_APPROVAL: "pending_approval",
  ACTIVE: "active",
  BLOCKED: "blocked",
  REJECTED: "rejected",
  RELEASED: DEVICE_RELEASED_STATUS,
} as const;

export type DeviceLifecycleStatus =
  (typeof DEVICE_STATUS)[keyof typeof DEVICE_STATUS];

export type DeviceAccessDenialCode =
  | "DEVICE_PENDING_APPROVAL"
  | "DEVICE_BLOCKED"
  | "DEVICE_REJECTED"
  | "DEVICE_RELEASED"
  | "DEVICE_LICENSE_MISMATCH"
  | "DEVICE_ORG_MISMATCH"
  | "DEVICE_NOT_BOUND"
  | "DEVICE_INVALID_STATUS";

export type DeviceAccessContext = {
  device: {
    orgId: string;
    status: string;
    licenseId: string | null;
  };
  license: {
    id: string;
    orgId: string;
  };
};

export type DeviceAccessResult =
  | { allowed: true }
  | { allowed: false; code: DeviceAccessDenialCode; message: string };

function deny(
  code: DeviceAccessDenialCode,
  message: string,
): DeviceAccessResult {
  return { allowed: false, code, message };
}

/**
 * Pure POS access decision for Phase 2+ route integration.
 * Phase 1: exported and tested only — live routes are not wired yet.
 */
export function evaluateDevicePosAccess(
  input: DeviceAccessContext,
): DeviceAccessResult {
  const { device, license } = input;
  const status = device.status.trim();

  switch (status) {
    case DEVICE_STATUS.PENDING_APPROVAL:
      return deny(
        "DEVICE_PENDING_APPROVAL",
        "Device is waiting for customer portal approval.",
      );
    case DEVICE_STATUS.BLOCKED:
      return deny("DEVICE_BLOCKED", "Device has been blocked.");
    case DEVICE_STATUS.REJECTED:
      return deny(
        "DEVICE_REJECTED",
        "Device activation was rejected in the customer portal.",
      );
    case DEVICE_STATUS.RELEASED:
      return deny(
        "DEVICE_RELEASED",
        "Device has been released from its license.",
      );
    case DEVICE_STATUS.ACTIVE:
      break;
    default:
      return deny(
        "DEVICE_INVALID_STATUS",
        `Device status "${status || "unknown"}" is not permitted for POS access.`,
      );
  }

  if (!device.licenseId?.trim()) {
    return deny(
      "DEVICE_NOT_BOUND",
      "Active device is not bound to a license.",
    );
  }

  if (String(device.licenseId) !== String(license.id)) {
    return deny(
      "DEVICE_LICENSE_MISMATCH",
      "Device is not bound to the provided license.",
    );
  }

  if (String(device.orgId) !== String(license.orgId)) {
    return deny(
      "DEVICE_ORG_MISMATCH",
      "Device organization does not match the license organization.",
    );
  }

  return { allowed: true };
}
