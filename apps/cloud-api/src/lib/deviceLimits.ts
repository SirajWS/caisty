/**
 * Device seat limits on licenses.
 * - positive integer = hard cap (Starter 1, Pro 3, Business 5 via plan config)
 * - null = unlimited (explicit enterprise/custom override on the license row only)
 * - never treat 0 as unlimited
 */

export function isUnlimitedDeviceLimit(
  maxDevices: number | null | undefined,
): boolean {
  return maxDevices === null;
}

/** Whether a new device may bind given current seat usage. */
export function canAcceptAdditionalDevice(
  usedSeats: number,
  maxDevices: number | null | undefined,
): boolean {
  if (maxDevices === null) return true;
  if (typeof maxDevices !== "number" || !Number.isFinite(maxDevices)) {
    return usedSeats < 1;
  }
  if (maxDevices <= 0) return false;
  return usedSeats < Math.trunc(maxDevices);
}

export function seatLimitForApi(
  maxDevices: number | null | undefined,
): { maxDevices: number | null; unlimitedDevices: boolean; limit: number | null } {
  if (isUnlimitedDeviceLimit(maxDevices)) {
    return { maxDevices: null, unlimitedDevices: true, limit: null };
  }
  if (typeof maxDevices === "number" && Number.isFinite(maxDevices) && maxDevices > 0) {
    const n = Math.trunc(maxDevices);
    return { maxDevices: n, unlimitedDevices: false, limit: n };
  }
  if (maxDevices === 0) {
    return { maxDevices: 0, unlimitedDevices: false, limit: 0 };
  }
  return { maxDevices: 1, unlimitedDevices: false, limit: 1 };
}
