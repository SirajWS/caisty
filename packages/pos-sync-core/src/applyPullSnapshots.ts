import {
  findPullOrderIndex,
  findPullShiftIndex,
  orderMatchesPullPayment,
  saleMatchesPullPayment,
  saleMatchesPullReceipt,
} from "./pullDeviceMatch.js";
import {
  mapCloudOrderToLocal,
  mapCloudPaymentToLocal,
  mapCloudReceiptEventToLocal,
  mapCloudReceiptToLocal,
  mapCloudShiftToLocal,
} from "./mappers.js";
import {
  isTerminalOrderStatus,
  isTerminalShiftStatus,
  shouldSkipPullOverwrite,
} from "./pendingOutboxGuard.js";
import type { PosPullChanges, OutboxEvent, SyncChangeEmitter } from "./types.js";

export type LocalSyncRepository = {
  loadOrders(): Array<Record<string, unknown>>;
  saveOrders(orders: Array<Record<string, unknown>>): void;
  getSales(): Array<Record<string, unknown>>;
  upsertSales(sales: Array<Record<string, unknown>>): void;
  listShifts(): Array<Record<string, unknown>>;
  upsertShift(shift: Record<string, unknown>): Record<string, unknown> | null;
  appendReceiptEvent(event: Record<string, unknown>): boolean;
  readOutbox(): OutboxEvent[];
};

function mergePullOrder(
  local: Record<string, unknown> | null,
  incoming: Record<string, unknown>,
) {
  if (!local) return incoming;
  if (
    isTerminalOrderStatus(local.status) &&
    !isTerminalOrderStatus(incoming.status)
  ) {
    return local;
  }
  const localUpdated = Number(local.updatedAt || local._ts || 0);
  const cloudUpdated = Number(incoming.updatedAt || 0);
  if (cloudUpdated >= localUpdated) {
    return { ...local, ...incoming };
  }
  return local;
}

export function createApplyPullSnapshots(
  repo: LocalSyncRepository,
  emitter: SyncChangeEmitter,
) {
  return function applyPullSnapshots(changes: PosPullChanges) {
    const applied = {
      orders: 0,
      receipts: 0,
      payments: 0,
      receiptEvents: 0,
      shifts: 0,
    };
    const outbox = repo.readOutbox();

    try {
      const orders = repo.loadOrders();
      let ordersChanged = false;

      for (const snapshot of changes.orders) {
        const incoming = mapCloudOrderToLocal(snapshot);
        if (!incoming) continue;
        const idx = findPullOrderIndex(orders, incoming);
        const local = idx >= 0 ? orders[idx] : null;
        const localId = String(local?.id || incoming.id);

        if (
          shouldSkipPullOverwrite(outbox, {
            localId,
            outboxType: "order",
            localUpdatedAt: local?.updatedAt || local?._ts,
            cloudUpdatedAt: incoming.updatedAt,
            cloudTerminal: isTerminalOrderStatus(incoming.status),
          })
        ) {
          continue;
        }

        const merged = mergePullOrder(local, incoming);
        if (idx >= 0) orders[idx] = merged;
        else orders.unshift(merged);
        ordersChanged = true;
        applied.orders += 1;
      }

      if (ordersChanged) {
        repo.saveOrders(orders);
        emitter.emitOrdersChanged({ applied: { orders: applied.orders } });
      }

      const sales = repo.getSales();
      const toUpsert: Array<Record<string, unknown>> = [];
      for (const snapshot of changes.receipts) {
        const incoming = mapCloudReceiptToLocal(snapshot);
        const local =
          sales.find((sale) => saleMatchesPullReceipt(sale, incoming)) || null;
        const localId = String(local?.id || incoming.id);
        if (
          shouldSkipPullOverwrite(outbox, {
            localId,
            outboxType: "receipt",
            localUpdatedAt: local?.updatedAt || local?.timestamp,
            cloudUpdatedAt: incoming.updatedAt,
          })
        ) {
          continue;
        }
        toUpsert.push(local ? { ...local, ...incoming } : incoming);
        applied.receipts += 1;
      }
      if (toUpsert.length > 0) {
        repo.upsertSales(toUpsert);
        emitter.emitSalesChanged();
      }

      let paymentOrdersChanged = false;
      for (const snapshot of changes.payments) {
        const incoming = mapCloudPaymentToLocal(snapshot);
        const sale = sales.find((s) => saleMatchesPullPayment(s, incoming));
        const order = repo
          .loadOrders()
          .find((o) => orderMatchesPullPayment(o, incoming));
        if (!sale && !order) continue;

        const outboxLocalId = String(
          sale?.id || order?.id || incoming.localReceiptId || incoming.localOrderId,
        );
        if (
          shouldSkipPullOverwrite(outbox, {
            localId: outboxLocalId,
            outboxType: "payment",
            localUpdatedAt:
              sale?.updatedAt || order?.updatedAt || order?._ts,
            cloudUpdatedAt: incoming.updatedAt || incoming.paidAt,
          })
        ) {
          continue;
        }

        if (order) {
          const ordersNow = repo.loadOrders();
          const idx = findPullOrderIndex(ordersNow, order);
          if (idx >= 0) {
            const current = ordersNow[idx];
            ordersNow[idx] = {
              ...current,
              paymentMethod: incoming.method,
              payment: { method: incoming.method },
              paid: true,
            };
            repo.saveOrders(ordersNow);
            paymentOrdersChanged = true;
          }
        }
        applied.payments += 1;
      }
      if (paymentOrdersChanged) {
        emitter.emitOrdersChanged({
          applied: { payments: applied.payments },
          ordersChanged: true,
        });
      }

      let receiptEventsChanged = false;
      for (const snapshot of changes.receiptEvents) {
        const incoming = mapCloudReceiptEventToLocal(snapshot);
        if (repo.appendReceiptEvent(incoming)) {
          applied.receiptEvents += 1;
          receiptEventsChanged = true;
        }
      }
      if (receiptEventsChanged) emitter.emitReceiptEventsChanged();

      const shifts = repo.listShifts();
      let shiftsChanged = false;
      for (const snapshot of changes.shifts) {
        const incoming = mapCloudShiftToLocal(snapshot);
        const idx = findPullShiftIndex(shifts, incoming);
        const existing = idx >= 0 ? shifts[idx] : null;
        if (
          shouldSkipPullOverwrite(outbox, {
            localId: String(incoming.shiftId),
            outboxType: "shift",
            localUpdatedAt: existing?.updatedAt,
            cloudUpdatedAt: incoming.updatedAt,
            cloudTerminal: isTerminalShiftStatus(incoming.status),
          })
        ) {
          continue;
        }
        const stored = repo.upsertShift(
          existing ? { ...existing, ...incoming } : incoming,
        );
        if (stored) {
          applied.shifts += 1;
          shiftsChanged = true;
        }
      }
      if (shiftsChanged) emitter.emitShiftsChanged();

      return { ok: true as const, applied };
    } catch (err) {
      return {
        ok: false as const,
        applied,
        error: err instanceof Error ? err.message : "apply_failed",
      };
    }
  };
}
