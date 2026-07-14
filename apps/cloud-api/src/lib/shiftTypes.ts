/**
 * Supported POS shift statuses and schema versions (Sprint 5.3B).
 */

export const SHIFT_STATUS = {
  OPEN: "open",
  CLOSED: "closed",
} as const;

export type ShiftStatus = (typeof SHIFT_STATUS)[keyof typeof SHIFT_STATUS];

export const SUPPORTED_SHIFT_STATUSES: readonly ShiftStatus[] = [
  SHIFT_STATUS.OPEN,
  SHIFT_STATUS.CLOSED,
];

export const SUPPORTED_SHIFT_SCHEMA_VERSIONS = [1] as const;

export type ShiftSchemaVersion =
  (typeof SUPPORTED_SHIFT_SCHEMA_VERSIONS)[number];

export function isShiftStatus(value: string): value is ShiftStatus {
  return (SUPPORTED_SHIFT_STATUSES as readonly string[]).includes(value);
}

export function isSupportedShiftSchemaVersion(
  value: number,
): value is ShiftSchemaVersion {
  return (SUPPORTED_SHIFT_SCHEMA_VERSIONS as readonly number[]).includes(value);
}

export const BUSINESS_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isBusinessDate(value: string): boolean {
  if (!BUSINESS_DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime());
}
