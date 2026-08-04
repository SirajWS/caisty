import type { DeviceAccessDenialCode } from "./deviceAccessPolicy.js";

/** All POS device access denials use 403 — credentials are valid but access is not granted. */
export function httpStatusForDeviceAccessCode(_code: DeviceAccessDenialCode): 403 {
  return 403;
}

export function formatDeviceAccessDenial(denial: {
  code: DeviceAccessDenialCode;
  message: string;
}) {
  return {
    ok: false as const,
    code: denial.code,
    message: denial.message,
  };
}

/** Bind registered a pending approval request (HTTP 202 — not yet POS-capable). */
export function formatPendingBindResponse(device: {
  id: string;
  name: string;
  type: string;
}) {
  return {
    ok: false as const,
    code: "DEVICE_PENDING_APPROVAL" as const,
    message:
      "Device registered and waiting for approval in the customer portal.",
    device: {
      id: device.id,
      name: device.name,
      type: device.type,
      status: "pending_approval" as const,
      licenseId: null,
    },
  };
}

/** Verify/bootstrap for a device waiting on portal approval — no business data. */
export function formatPendingVerifyResponse(device: { id: string }) {
  return {
    ok: false as const,
    code: "DEVICE_PENDING_APPROVAL" as const,
    message: "Device is waiting for customer portal approval.",
    device: {
      id: device.id,
      status: "pending_approval" as const,
    },
  };
}
