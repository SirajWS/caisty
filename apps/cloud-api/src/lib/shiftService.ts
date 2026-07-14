import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import { posShifts } from "../db/schema/posSync.js";
import {
  mapPortalOpenShiftRecord,
  mapPortalShiftRecord,
  type PortalOpenShiftRecord,
  type PortalShiftDbRow,
  type PortalShiftRecord,
} from "./portalShifts.js";
import { SHIFT_STATUS, type ShiftStatus } from "./shiftTypes.js";
import { decideShiftUpsert } from "./shiftUpsertLogic.js";

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

export type UpsertShiftSnapshotInput = {
  orgId: string;
  customerId: string | null;
  deviceId: string;
  syncBatchId?: string | null;
  localShiftId: string;
  status: ShiftStatus;
  cashier?: string | null;
  businessDate: string;
  startedAt: Date;
  endedAt?: Date | null;
  openingFloatMinor: number;
  closingFloatMinor?: number | null;
  previousClosingFloatMinor?: number | null;
  currency: string;
  schemaVersion: number;
};

export type ListShiftsForCustomerInput = {
  orgId: string;
  customerId: string;
  status?: ShiftStatus | "all";
  deviceId?: string;
  from?: string;
  to?: string;
  limit?: number;
};

function shiftSelectFields() {
  return {
    id: posShifts.id,
    localShiftId: posShifts.localShiftId,
    status: posShifts.status,
    cashier: posShifts.cashier,
    deviceId: posShifts.deviceId,
    deviceName: devices.name,
    businessDate: sql<string>`${posShifts.businessDate}::text`,
    startedAt: posShifts.startedAt,
    endedAt: posShifts.endedAt,
    openingFloatMinor: posShifts.openingFloatMinor,
    closingFloatMinor: posShifts.closingFloatMinor,
    previousClosingFloatMinor: posShifts.previousClosingFloatMinor,
    currency: posShifts.currency,
  };
}

export class ShiftService {
  async findByLocalId(orgId: string, deviceId: string, localShiftId: string) {
    const [row] = await db
      .select({
        id: posShifts.id,
        status: posShifts.status,
      })
      .from(posShifts)
      .where(
        and(
          eq(posShifts.orgId, orgId),
          eq(posShifts.deviceId, deviceId),
          eq(posShifts.localShiftId, localShiftId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async upsertShiftSnapshot(
    input: UpsertShiftSnapshotInput,
  ): Promise<
    | { status: "accepted" }
    | { status: "duplicate" }
    | { status: "failed"; code: string; error: string }
  > {
    const existing = await this.findByLocalId(
      input.orgId,
      input.deviceId,
      input.localShiftId,
    );

    const decision = decideShiftUpsert(
      existing ? { status: existing.status as ShiftStatus } : null,
      { status: input.status },
    );

    if (decision.action === "reject_closed_to_open") {
      return {
        status: "failed",
        code: "shift_already_closed",
        error: `Shift ${input.localShiftId} is already closed and cannot reopen.`,
      };
    }

    if (decision.action === "duplicate") {
      return { status: "duplicate" };
    }

    if (decision.action === "update_close") {
      await db
        .update(posShifts)
        .set({
          status: SHIFT_STATUS.CLOSED,
          endedAt: input.endedAt ?? null,
          closingFloatMinor: input.closingFloatMinor ?? null,
          updatedAt: new Date(),
        })
        .where(eq(posShifts.id, existing!.id));

      return { status: "accepted" };
    }

    try {
      await db.insert(posShifts).values({
        orgId: input.orgId,
        customerId: input.customerId,
        deviceId: input.deviceId,
        localShiftId: input.localShiftId,
        status: input.status,
        cashier: input.cashier ?? null,
        businessDate: input.businessDate,
        startedAt: input.startedAt,
        endedAt:
          input.status === SHIFT_STATUS.CLOSED ? input.endedAt ?? null : null,
        openingFloatMinor: input.openingFloatMinor,
        closingFloatMinor:
          input.status === SHIFT_STATUS.CLOSED
            ? input.closingFloatMinor ?? null
            : null,
        previousClosingFloatMinor: input.previousClosingFloatMinor ?? null,
        currency: input.currency,
        schemaVersion: input.schemaVersion,
        syncBatchId: input.syncBatchId ?? null,
      });
      return { status: "accepted" };
    } catch (err: unknown) {
      if (!isUniqueViolation(err)) {
        throw err;
      }

      const raced = await this.findByLocalId(
        input.orgId,
        input.deviceId,
        input.localShiftId,
      );
      if (raced) {
        const racedDecision = decideShiftUpsert(
          { status: raced.status as ShiftStatus },
          { status: input.status },
        );
        if (racedDecision.action === "update_close") {
          await db
            .update(posShifts)
            .set({
              status: SHIFT_STATUS.CLOSED,
              endedAt: input.endedAt ?? null,
              closingFloatMinor: input.closingFloatMinor ?? null,
              updatedAt: new Date(),
            })
            .where(eq(posShifts.id, raced.id));
          return { status: "accepted" };
        }
        if (racedDecision.action === "reject_closed_to_open") {
          return {
            status: "failed",
            code: "shift_already_closed",
            error: `Shift ${input.localShiftId} is already closed and cannot reopen.`,
          };
        }
        return { status: "duplicate" };
      }

      if (input.status === SHIFT_STATUS.OPEN) {
        return {
          status: "failed",
          code: "device_open_shift_exists",
          error: "This device already has an open shift.",
        };
      }

      return { status: "duplicate" };
    }
  }

  async getOpenShiftForCustomer(
    orgId: string,
    customerId: string,
  ): Promise<PortalOpenShiftRecord | null> {
    const [row] = await db
      .select(shiftSelectFields())
      .from(posShifts)
      .innerJoin(devices, eq(posShifts.deviceId, devices.id))
      .where(
        and(
          eq(posShifts.orgId, orgId),
          eq(devices.customerId, customerId),
          eq(posShifts.status, SHIFT_STATUS.OPEN),
        ),
      )
      .orderBy(desc(posShifts.startedAt))
      .limit(1);

    if (!row) return null;
    return mapPortalOpenShiftRecord(row as PortalShiftDbRow);
  }

  async listShiftsForCustomer(
    input: ListShiftsForCustomerInput,
  ): Promise<PortalShiftRecord[]> {
    const filters = [
      eq(posShifts.orgId, input.orgId),
      eq(devices.customerId, input.customerId),
    ];

    if (input.status && input.status !== "all") {
      filters.push(eq(posShifts.status, input.status));
    }
    if (input.deviceId) {
      filters.push(eq(posShifts.deviceId, input.deviceId));
    }
    if (input.from) {
      filters.push(gte(posShifts.businessDate, input.from));
    }
    if (input.to) {
      filters.push(lte(posShifts.businessDate, input.to));
    }

    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);

    const rows = await db
      .select(shiftSelectFields())
      .from(posShifts)
      .innerJoin(devices, eq(posShifts.deviceId, devices.id))
      .where(and(...filters))
      .orderBy(desc(posShifts.startedAt))
      .limit(limit);

    return rows.map((row) => mapPortalShiftRecord(row as PortalShiftDbRow));
  }

  async getLatestClosedShift(
    orgId: string,
    customerId: string,
    deviceId?: string,
  ): Promise<PortalShiftRecord | null> {
    const filters = [
      eq(posShifts.orgId, orgId),
      eq(devices.customerId, customerId),
      eq(posShifts.status, SHIFT_STATUS.CLOSED),
    ];
    if (deviceId) {
      filters.push(eq(posShifts.deviceId, deviceId));
    }

    const [row] = await db
      .select(shiftSelectFields())
      .from(posShifts)
      .innerJoin(devices, eq(posShifts.deviceId, devices.id))
      .where(and(...filters))
      .orderBy(desc(posShifts.endedAt))
      .limit(1);

    if (!row) return null;
    return mapPortalShiftRecord(row as PortalShiftDbRow);
  }
}

export const shiftService = new ShiftService();
