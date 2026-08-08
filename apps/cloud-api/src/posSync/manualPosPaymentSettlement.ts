import { and, eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { posOrders } from "../db/schema/posSync.js";
import { isProviderOrder } from "../lib/orderSource.js";
import type { PosSyncPaymentPayload } from "./types.js";

const POS_MANUAL_METHODS = new Set(["cash", "card"]);

type DbExecutor = Pick<typeof db, "select" | "update">;

/** True when a POS device reports a manual cash/card settlement with proof. */
export function isManualPosSettlementPayment(
  payload: Pick<PosSyncPaymentPayload, "method" | "localOrderId" | "paidAt">,
): boolean {
  const method = String(payload.method ?? "")
    .trim()
    .toLowerCase();
  const localOrderId = String(payload.localOrderId ?? "").trim();
  return (
    POS_MANUAL_METHODS.has(method) &&
    localOrderId.length > 0 &&
    Boolean(payload.paidAt)
  );
}

/**
 * Mark matching order rows paid after a confirmed manual POS settlement.
 * - Always updates the settling device row.
 * - Also updates provider-order rows on other devices (same org + localOrderId).
 */
export async function confirmManualPosOrderPayment(
  executor: DbExecutor,
  input: {
    orgId: string;
    deviceId: string;
    localOrderId: string;
  },
): Promise<number> {
  const localOrderId = input.localOrderId.trim();
  if (!localOrderId) return 0;

  const rows = await executor
    .select({
      deviceId: posOrders.deviceId,
      platform: posOrders.platform,
    })
    .from(posOrders)
    .where(
      and(
        eq(posOrders.orgId, input.orgId),
        eq(posOrders.localOrderId, localOrderId),
      ),
    );

  const deviceIdsToUpdate = new Set<string>();
  for (const row of rows) {
    if (row.deviceId === input.deviceId) {
      deviceIdsToUpdate.add(row.deviceId);
      continue;
    }
    if (isProviderOrder(row.platform)) {
      deviceIdsToUpdate.add(row.deviceId);
    }
  }

  if (deviceIdsToUpdate.size === 0) {
    deviceIdsToUpdate.add(input.deviceId);
  }

  let updated = 0;
  for (const deviceId of deviceIdsToUpdate) {
    await executor
      .update(posOrders)
      .set({
        paymentStatus: "paid",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(posOrders.orgId, input.orgId),
          eq(posOrders.deviceId, deviceId),
          eq(posOrders.localOrderId, localOrderId),
        ),
      );
    updated += 1;
  }

  return updated;
}
