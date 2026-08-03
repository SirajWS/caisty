/**
 * Central seat occupation rules for device lifecycle statuses.
 *
 * | Status            | licenseId set | Occupies seat |
 * |-------------------|---------------|---------------|
 * | active            | yes           | yes           |
 * | blocked           | yes           | yes           |
 * | pending_approval  | no*           | no            |
 * | rejected          | no            | no            |
 * | released          | no            | no            |
 *
 * * pending_approval uses pending_license_id (Phase 2+) — not license_id.
 */

export const DEVICE_SEAT_CONSUMING_STATUSES = ["active", "blocked"] as const;

export type DeviceSeatInput = {
  status: string;
  licenseId: string | null;
};

export function deviceOccupiesSeat(device: DeviceSeatInput): boolean {
  if (!device.licenseId?.trim()) {
    return false;
  }

  const status = device.status.trim();
  return (
    status === "active" ||
    status === "blocked"
  );
}

/** Pure helper for tests and callers that already have device rows in memory. */
export function countSeatOccupyingDevicesForLicense(
  devices: DeviceSeatInput[],
  licenseId: string,
): number {
  const target = String(licenseId);
  return devices.filter(
    (device) =>
      device.licenseId != null &&
      String(device.licenseId) === target &&
      deviceOccupiesSeat(device),
  ).length;
}
