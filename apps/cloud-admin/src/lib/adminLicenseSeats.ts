/** Mirrors cloud-api deviceSeatPolicy — do not invent a second occupancy rule. */

export function deviceOccupiesSeat(device: {
  status?: string | null;
  licenseId?: string | null;
  archivedAt?: string | null;
}): boolean {
  if (device.archivedAt) return false;
  if (!device.licenseId?.trim()) return false;
  const status = (device.status ?? "").trim();
  return status === "active" || status === "blocked";
}

export function countOccupiedSeatsForLicense<
  T extends {
    status?: string | null;
    licenseId?: string | null;
    archivedAt?: string | null;
  },
>(devices: T[], licenseId: string): number {
  return devices.filter(
    (device) =>
      device.licenseId === licenseId && deviceOccupiesSeat(device),
  ).length;
}

export function formatMaxDevices(
  maxDevices: number | null | undefined,
): string {
  if (maxDevices === null) return "Unlimited";
  if (typeof maxDevices === "number" && Number.isFinite(maxDevices)) {
    return String(maxDevices);
  }
  return "—";
}

export function formatSeatUsage(
  used: number,
  maxDevices: number | null | undefined,
): string {
  const cap = formatMaxDevices(maxDevices);
  if (cap === "Unlimited") return `${used} / Unlimited`;
  if (cap === "—") return `${used} / —`;
  return `${used} / ${cap}`;
}

export function seatTotalForDisplay(
  maxDevices: number | null | undefined,
): number | null {
  return maxDevices === null ? null : (maxDevices ?? null);
}

export function summarizeCustomerDeviceRecords<
  T extends {
    id: string;
    status?: string | null;
    licenseId?: string | null;
    archivedAt?: string | null;
  },
>(devices: T[]): {
  visibleRecords: number;
  occupiedSeats: number;
  released: number;
  pending: number;
} {
  let occupiedSeats = 0;
  let released = 0;
  let pending = 0;
  for (const device of devices) {
    const status = (device.status ?? "").toLowerCase().trim();
    if (deviceOccupiesSeat(device)) occupiedSeats += 1;
    if (status === "released") released += 1;
    if (status === "pending_approval") pending += 1;
  }
  return {
    visibleRecords: devices.length,
    occupiedSeats,
    released,
    pending,
  };
}
