import type { LocalSyncRepository, OutboxEvent } from "@caisty/pos-sync-core";

import { storage } from "../platform/storage.js";

const ORDERS_KEY = "dinaro.orders";
const SALES_KEY = "dinaro.sales";
const SHIFTS_KEY = "dinaro.shifts";
const RECEIPT_EVENTS_KEY = "dinaro.receiptEvents";
const OUTBOX_KEY = "caisty.sync.outbox";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  storage.setItem(key, JSON.stringify(value));
}

export function createLocalSyncRepository(): LocalSyncRepository {
  return {
    loadOrders() {
      return readJson<Array<Record<string, unknown>>>(ORDERS_KEY, []);
    },
    saveOrders(orders) {
      writeJson(ORDERS_KEY, orders);
    },
    getSales() {
      return readJson<Array<Record<string, unknown>>>(SALES_KEY, []);
    },
    upsertSales(sales) {
      const existing = readJson<Array<Record<string, unknown>>>(SALES_KEY, []);
      const map = new Map(existing.map((sale) => [String(sale.id), sale]));
      for (const sale of sales) {
        map.set(String(sale.id), sale);
      }
      writeJson(SALES_KEY, [...map.values()]);
    },
    listShifts() {
      return readJson<Array<Record<string, unknown>>>(SHIFTS_KEY, []);
    },
    upsertShift(shift) {
      const shifts = readJson<Array<Record<string, unknown>>>(SHIFTS_KEY, []);
      const idx = shifts.findIndex(
        (row) =>
          String(row.shiftId || row.localShiftId) ===
          String(shift.shiftId || shift.localShiftId),
      );
      if (idx >= 0) shifts[idx] = shift;
      else shifts.unshift(shift);
      writeJson(SHIFTS_KEY, shifts);
      return shift;
    },
    appendReceiptEvent(event) {
      const events = readJson<Array<Record<string, unknown>>>(
        RECEIPT_EVENTS_KEY,
        [],
      );
      const id = String(event.id);
      if (events.some((row) => String(row.id) === id)) return false;
      events.unshift(event);
      writeJson(RECEIPT_EVENTS_KEY, events);
      return true;
    },
    readOutbox() {
      return readJson<OutboxEvent[]>(OUTBOX_KEY, []);
    },
  };
}

export function readLocalCounts() {
  const repo = createLocalSyncRepository();
  return {
    orders: repo.loadOrders().length,
    receipts: repo.getSales().length,
    payments: repo.getSales().filter((s) => s.payment).length,
    shifts: repo.listShifts().length,
    receiptEvents: readJson<Array<unknown>>(RECEIPT_EVENTS_KEY, []).length,
  };
}
