/**
 * Portal-facing shift DTOs and mappers (Sprint 5.3B).
 */

import type { ShiftStatus } from "./shiftTypes.js";

export type PortalOpenShiftRecord = {
  shiftId: string;
  status: ShiftStatus;
  cashier: string | null;
  deviceName: string | null;
  businessDate: string;
  startedAt: string;
  durationMinutes: number;
  openingFloatMinor: number;
  currency: string;
};

export type PortalShiftRecord = {
  id: string;
  localShiftId: string;
  status: ShiftStatus;
  cashier: string | null;
  deviceId: string;
  deviceName: string | null;
  businessDate: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  openingFloatMinor: number;
  closingFloatMinor: number | null;
  previousClosingFloatMinor: number | null;
  currency: string;
};

export type PortalShiftDbRow = {
  id: string;
  localShiftId: string;
  status: string;
  cashier: string | null;
  deviceId: string;
  deviceName: string | null;
  businessDate: string;
  startedAt: Date;
  endedAt: Date | null;
  openingFloatMinor: number;
  closingFloatMinor: number | null;
  previousClosingFloatMinor: number | null;
  currency: string;
};

export function deriveShiftDurationMinutes(
  startedAt: Date,
  endedAt: Date | null,
  now: Date = new Date(),
): number {
  const end = endedAt ?? now;
  const diffMs = end.getTime() - startedAt.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / 60_000);
}

export function mapPortalShiftRecord(row: PortalShiftDbRow): PortalShiftRecord {
  const durationMinutes =
    row.status === "closed" && row.endedAt
      ? deriveShiftDurationMinutes(row.startedAt, row.endedAt)
      : row.status === "open"
        ? deriveShiftDurationMinutes(row.startedAt, null)
        : null;

  return {
    id: row.id,
    localShiftId: row.localShiftId,
    status: row.status as ShiftStatus,
    cashier: row.cashier,
    deviceId: row.deviceId,
    deviceName: row.deviceName,
    businessDate: row.businessDate,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    durationMinutes,
    openingFloatMinor: row.openingFloatMinor,
    closingFloatMinor: row.closingFloatMinor,
    previousClosingFloatMinor: row.previousClosingFloatMinor,
    currency: row.currency,
  };
}

export function mapPortalOpenShiftRecord(
  row: PortalShiftDbRow,
  now: Date = new Date(),
): PortalOpenShiftRecord {
  return {
    shiftId: row.id,
    status: row.status as ShiftStatus,
    cashier: row.cashier,
    deviceName: row.deviceName,
    businessDate: row.businessDate,
    startedAt: row.startedAt.toISOString(),
    durationMinutes: deriveShiftDurationMinutes(row.startedAt, null, now),
    openingFloatMinor: row.openingFloatMinor,
    currency: row.currency,
  };
}
