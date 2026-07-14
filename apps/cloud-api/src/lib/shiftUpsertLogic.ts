/**
 * Pure shift upsert decision logic (Sprint 5.3B).
 * Separated from DB layer for testability.
 */

import { SHIFT_STATUS, type ShiftStatus } from "./shiftTypes.js";

export type ExistingShiftSnapshot = {
  status: ShiftStatus;
};

export type IncomingShiftSnapshot = {
  status: ShiftStatus;
};

export type ShiftUpsertDecision =
  | { action: "insert" }
  | { action: "update_close" }
  | { action: "duplicate" }
  | { action: "reject_closed_to_open" };

export function decideShiftUpsert(
  existing: ExistingShiftSnapshot | null,
  incoming: IncomingShiftSnapshot,
): ShiftUpsertDecision {
  if (!existing) {
    return { action: "insert" };
  }

  if (existing.status === SHIFT_STATUS.CLOSED) {
    if (incoming.status === SHIFT_STATUS.OPEN) {
      return { action: "reject_closed_to_open" };
    }
    return { action: "duplicate" };
  }

  if (incoming.status === SHIFT_STATUS.OPEN) {
    return { action: "duplicate" };
  }

  return { action: "update_close" };
}
