import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import { orgStationCounters } from "../db/schema/orgStationCounters.js";

type Tx = {
  select: typeof db.select;
  insert: typeof db.insert;
  update: typeof db.update;
};

export const STATION_RECEIPT_NUMBER_RE =
  /^R(\d{8})-(K\d{2,})-(\d{4})$/;

export function formatStationCode(n: number): string {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error("station sequence must be a positive integer");
  }
  return `K${String(n).padStart(2, "0")}`;
}

export function parseStationSequence(code: string | null | undefined): number | null {
  if (!code) return null;
  const match = /^K(\d{2,})$/.exec(code.trim());
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

export function parseStationReceiptNumber(value: string | null | undefined): {
  date: string;
  stationCode: string;
  sequence: string;
} | null {
  if (!value) return null;
  const match = STATION_RECEIPT_NUMBER_RE.exec(value.trim());
  if (!match) return null;
  return { date: match[1], stationCode: match[2], sequence: match[3] };
}

export function isStationReceiptNumber(value: string | null | undefined): boolean {
  return parseStationReceiptNumber(value) !== null;
}

export async function assignStationCodeIfNeeded(
  orgId: string,
  deviceId: string,
  tx?: Tx,
): Promise<{ ok: true; stationCode: string } | { ok: false; message: string }> {
  if (!tx) {
    return db.transaction((inner) =>
      assignStationCodeIfNeeded(orgId, deviceId, inner as Tx),
    );
  }
  return assignStationCodeInTx(orgId, deviceId, tx);
}

async function assignStationCodeInTx(
  orgId: string,
  deviceId: string,
  tx: Tx,
): Promise<{ ok: true; stationCode: string } | { ok: false; message: string }> {
  const [device] = await tx
    .select({
      id: devices.id,
      orgId: devices.orgId,
      stationCode: devices.stationCode,
    })
    .from(devices)
    .where(eq(devices.id, deviceId))
    .for("update")
    .limit(1);

  if (!device || String(device.orgId) !== String(orgId)) {
    return { ok: false, message: "Device was not found for station code assignment." };
  }
  if (device.stationCode) {
    return { ok: true, stationCode: device.stationCode };
  }

  await tx
    .insert(orgStationCounters)
    .values({ orgId, lastAssigned: 0 })
    .onConflictDoNothing({ target: orgStationCounters.orgId });

  for (let attempt = 0; attempt < 8; attempt++) {
    const [again] = await tx
      .select({ stationCode: devices.stationCode })
      .from(devices)
      .where(eq(devices.id, deviceId))
      .limit(1);
    if (again?.stationCode) {
      return { ok: true, stationCode: again.stationCode };
    }

    const [counter] = await tx
      .update(orgStationCounters)
      .set({ lastAssigned: sql`${orgStationCounters.lastAssigned} + 1` })
      .where(eq(orgStationCounters.orgId, orgId))
      .returning({ lastAssigned: orgStationCounters.lastAssigned });

    if (!counter) {
      return { ok: false, message: "Station counter is unavailable." };
    }

    const stationCode = formatStationCode(counter.lastAssigned);
    try {
      const [updated] = await tx
        .update(devices)
        .set({ stationCode })
        .where(and(eq(devices.id, deviceId), isNull(devices.stationCode)))
        .returning({ stationCode: devices.stationCode });

      if (updated?.stationCode) {
        return { ok: true, stationCode: updated.stationCode };
      }
    } catch (err: unknown) {
      if (!isUniqueViolation(err)) throw err;
    }
  }

  return { ok: false, message: "Could not assign a unique station code." };
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}
