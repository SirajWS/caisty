import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  createApplyPullSnapshots,
  type LocalSyncRepository,
} from "./applyPullSnapshots.js";
import type { OutboxEvent } from "./types.js";

function createMockRepo(): LocalSyncRepository & {
  setOrders(orders: Array<Record<string, unknown>>): void;
  setSales(sales: Array<Record<string, unknown>>): void;
  setShifts(shifts: Array<Record<string, unknown>>): void;
  setOutbox(outbox: OutboxEvent[]): void;
  orders: Array<Record<string, unknown>>;
  sales: Array<Record<string, unknown>>;
  shifts: Array<Record<string, unknown>>;
  receiptEvents: Array<Record<string, unknown>>;
  outbox: OutboxEvent[];
} {
  const state = {
    orders: [] as Array<Record<string, unknown>>,
    sales: [] as Array<Record<string, unknown>>,
    shifts: [] as Array<Record<string, unknown>>,
    receiptEvents: [] as Array<Record<string, unknown>>,
    outbox: [] as OutboxEvent[],
  };

  const repo = {
    get orders() {
      return state.orders;
    },
    get sales() {
      return state.sales;
    },
    get shifts() {
      return state.shifts;
    },
    get receiptEvents() {
      return state.receiptEvents;
    },
    get outbox() {
      return state.outbox;
    },
    setOrders(orders: Array<Record<string, unknown>>) {
      state.orders = orders;
    },
    setSales(sales: Array<Record<string, unknown>>) {
      state.sales = sales;
    },
    setShifts(shifts: Array<Record<string, unknown>>) {
      state.shifts = shifts;
    },
    setOutbox(outbox: OutboxEvent[]) {
      state.outbox = outbox;
    },
    loadOrders: () => state.orders,
    saveOrders: (orders: Array<Record<string, unknown>>) => {
      state.orders = orders;
    },
    getSales: () => state.sales,
    upsertSales: (incoming: Array<Record<string, unknown>>) => {
      const map = new Map(state.sales.map((sale) => [String(sale.id), sale]));
      for (const sale of incoming) map.set(String(sale.id), sale);
      state.sales = [...map.values()];
    },
    listShifts: () => state.shifts,
    upsertShift: (shift: Record<string, unknown>) => {
      const idx = state.shifts.findIndex(
        (row) =>
          String(row.shiftId || row.localShiftId) ===
          String(shift.shiftId || shift.localShiftId),
      );
      if (idx >= 0) state.shifts[idx] = shift;
      else state.shifts.unshift(shift);
      return shift;
    },
    appendReceiptEvent: (event: Record<string, unknown>) => {
      const id = String(event.id);
      if (state.receiptEvents.some((row) => String(row.id) === id)) return false;
      state.receiptEvents.unshift(event);
      return true;
    },
    readOutbox: () => state.outbox,
  };

  return repo;
}

const emitter = {
  emitOrdersChanged: vi.fn(),
  emitSalesChanged: vi.fn(),
  emitReceiptEventsChanged: vi.fn(),
  emitShiftsChanged: vi.fn(),
};

describe("applyPullSnapshots", () => {
  let repo: ReturnType<typeof createMockRepo>;

  beforeEach(() => {
    repo = createMockRepo();
    vi.clearAllMocks();
  });

  it("applies new provider order with accepted status", () => {
    const apply = createApplyPullSnapshots(repo, emitter);
    const result = apply({
      orders: [
        {
          id: "cloud-1",
          localOrderId: "wolt-1",
          providerOrderId: "ext-1",
          platform: "wolt",
          sourceDeviceId: "dev-b",
          status: "accepted",
          paymentStatus: "pending",
          paymentMethod: null,
          totalCents: 1000,
          currency: "EUR",
          soldAt: "2026-07-08T10:00:00.000Z",
          createdAt: "2026-07-08T10:00:00.000Z",
          updatedAt: "2026-07-08T10:00:00.000Z",
          lines: [],
        },
      ],
      receipts: [],
      payments: [],
      receiptEvents: [],
      shifts: [],
    });

    expect(result.ok).toBe(true);
    expect(result.applied.orders).toBe(1);
    expect(repo.orders).toHaveLength(1);
    expect(repo.orders[0].status).toBe("accepted");
    expect(emitter.emitOrdersChanged).toHaveBeenCalled();
  });

  it("updates order status to delivered", () => {
    repo.setOrders([
      {
        id: "ext-1",
        localOrderId: "wolt-1",
        platform: "wolt",
        status: "accepted",
        updatedAt: 1,
        _ts: 1,
      },
    ]);

    const apply = createApplyPullSnapshots(repo, emitter);
    apply({
      orders: [
        {
          id: "cloud-1",
          localOrderId: "wolt-1",
          providerOrderId: "ext-1",
          platform: "wolt",
          sourceDeviceId: "dev-b",
          status: "delivered",
          paymentStatus: "paid",
          paymentMethod: "card",
          totalCents: 1000,
          currency: "EUR",
          soldAt: "2026-07-08T10:00:00.000Z",
          createdAt: "2026-07-08T10:00:00.000Z",
          updatedAt: "2026-07-08T11:00:00.000Z",
          lines: [],
        },
      ],
      receipts: [],
      payments: [],
      receiptEvents: [],
      shifts: [],
    });

    expect(repo.orders[0].status).toBe("delivered");
  });

  it("applies payment pending to paid on linked order", () => {
    repo.setOrders([
      {
        id: "ext-1",
        localOrderId: "wolt-1",
        sourceDeviceId: "dev-a",
        status: "accepted",
        updatedAt: 1,
      },
    ]);

    const apply = createApplyPullSnapshots(repo, emitter);
    apply({
      orders: [],
      receipts: [],
      payments: [
        {
          id: "pay-1",
          localPaymentId: "pay-local",
          localOrderId: "wolt-1",
          localReceiptId: null,
          sourceDeviceId: "dev-a",
          method: "card",
          amountCents: 1000,
          currency: "EUR",
          paidAt: "2026-07-08T12:00:00.000Z",
          createdAt: "2026-07-08T12:00:00.000Z",
          updatedAt: "2026-07-08T12:00:00.000Z",
        },
      ],
      receiptEvents: [],
      shifts: [],
    });

    expect(repo.orders[0].paid).toBe(true);
    expect(emitter.emitOrdersChanged).toHaveBeenCalled();
  });

  it("adds receipt and emits sales changed", () => {
    const apply = createApplyPullSnapshots(repo, emitter);
    apply({
      orders: [],
      receipts: [
        {
          id: "rc-1",
          localReceiptId: "s100",
          localOrderId: "s100",
          localPaymentId: null,
          sourceDeviceId: "dev-a",
          receiptNumber: "R-100",
          netCents: 840,
          taxCents: 160,
          grossCents: 1000,
          currency: "EUR",
          fiscalStatus: "signed",
          status: "ACTIVE",
          soldAt: "2026-07-08T10:00:00.000Z",
          createdAt: "2026-07-08T10:00:00.000Z",
          updatedAt: "2026-07-08T10:00:00.000Z",
        },
      ],
      payments: [],
      receiptEvents: [],
      shifts: [],
    });

    expect(repo.sales).toHaveLength(1);
    expect(emitter.emitSalesChanged).toHaveBeenCalled();
  });

  it("dedupes receipt events", () => {
    const apply = createApplyPullSnapshots(repo, emitter);
    const changes = {
      orders: [],
      receipts: [],
      payments: [],
      receiptEvents: [
        {
          id: "row-1",
          eventId: "evt-1",
          receiptId: "rc-1",
          localReceiptId: "s100",
          sourceDeviceId: "dev-a",
          eventType: "created",
          occurredAt: "2026-07-08T10:00:00.000Z",
          createdAt: "2026-07-08T10:00:00.000Z",
          metadata: {},
        },
      ],
      shifts: [],
    };

    apply(changes);
    apply(changes);

    expect(repo.receiptEvents).toHaveLength(1);
    expect(emitter.emitReceiptEventsChanged).toHaveBeenCalledTimes(1);
  });

  it("updates shift and emits shifts changed", () => {
    const apply = createApplyPullSnapshots(repo, emitter);
    apply({
      orders: [],
      receipts: [],
      payments: [],
      receiptEvents: [],
      shifts: [
        {
          id: "cloud-sh1",
          localShiftId: "sh1",
          sourceDeviceId: "dev-b",
          cashier: "A",
          status: "open",
          openingFloatMinor: 1000,
          closingFloatMinor: null,
          previousClosingFloatMinor: null,
          currency: "EUR",
          businessDate: "2026-07-08",
          openedAt: "2026-07-08T08:00:00.000Z",
          closedAt: null,
          createdAt: "2026-07-08T08:00:00.000Z",
          updatedAt: "2026-07-08T08:30:00.000Z",
        },
      ],
    });

    expect(repo.shifts).toHaveLength(1);
    expect(repo.shifts[0].status).toBe("open");
    expect(emitter.emitShiftsChanged).toHaveBeenCalled();
  });

  it("skips order overwrite when pending outbox exists", () => {
    repo.setOrders([
      {
        id: "ext-1",
        localOrderId: "wolt-1",
        platform: "wolt",
        status: "new",
        updatedAt: Date.parse("2026-07-08T12:00:00.000Z"),
      },
    ]);
    repo.setOutbox([
      {
        localId: "ext-1",
        type: "order",
        status: "pending",
        createdAt: Date.now(),
      },
    ]);

    const apply = createApplyPullSnapshots(repo, emitter);
    apply({
      orders: [
        {
          id: "cloud-1",
          localOrderId: "wolt-1",
          providerOrderId: "ext-1",
          platform: "wolt",
          sourceDeviceId: "dev-b",
          status: "accepted",
          paymentStatus: null,
          paymentMethod: null,
          totalCents: 1000,
          currency: "EUR",
          soldAt: "2026-07-08T10:00:00.000Z",
          createdAt: "2026-07-08T10:00:00.000Z",
          updatedAt: "2026-07-08T09:00:00.000Z",
          lines: [],
        },
      ],
      receipts: [],
      payments: [],
      receiptEvents: [],
      shifts: [],
    });

    expect(repo.orders[0].status).toBe("new");
  });
});
