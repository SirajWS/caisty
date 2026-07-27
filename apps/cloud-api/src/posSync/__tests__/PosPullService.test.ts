import { beforeEach, describe, expect, it, vi } from "vitest";

const eqCalls: Array<{ column: unknown; value: unknown }> = [];
const inArrayCalls: Array<{ column: unknown; values: unknown[] }> = [];

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: (column: unknown, value: unknown) => {
      eqCalls.push({ column, value });
      return actual.eq(column as never, value as never);
    },
    inArray: (column: unknown, values: unknown[]) => {
      inArrayCalls.push({ column, values });
      return actual.inArray(column as never, values as never);
    },
  };
});

const mocks = vi.hoisted(() => ({
  mockSelect: vi.fn(),
}));

vi.mock("../../db/client.js", () => ({
  db: {
    select: mocks.mockSelect,
  },
}));

import { encodePullCursor } from "../pullCursor.js";
import { InvalidPullCursorError } from "../pullErrors.js";
import { PosPullService } from "../PosPullService.js";
import {
  posOrderLines,
  posOrders,
  posReceiptEvents,
  posReceipts,
  posSalePayments,
  posShifts,
} from "../../db/schema/posSync.js";

const ORG_A = "11111111-1111-1111-1111-111111111111";
const ORG_B = "99999999-9999-9999-9999-999999999999";
const DEVICE_A = "33333333-3333-3333-3333-333333333333";
const DEVICE_B = "33333333-3333-3333-3333-333333333334";
const DEVICE_OTHER_ORG = "33333333-3333-3333-3333-333333333399";

const authA = {
  orgId: ORG_A,
  customerId: "22222222-2222-2222-2222-222222222222",
  deviceId: DEVICE_A,
  licenseId: "44444444-4444-4444-4444-444444444444",
};

type Seed = {
  orders: Array<Record<string, unknown>>;
  orderLines: Array<Record<string, unknown>>;
  receipts: Array<Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
  receiptEvents: Array<Record<string, unknown>>;
  shifts: Array<Record<string, unknown>>;
};

function lastEqValue(column: unknown): unknown {
  for (let i = eqCalls.length - 1; i >= 0; i -= 1) {
    if (eqCalls[i]?.column === column) {
      return eqCalls[i]?.value;
    }
  }
  return undefined;
}

function lastInArrayValues(column: unknown): unknown[] | undefined {
  for (let i = inArrayCalls.length - 1; i >= 0; i -= 1) {
    if (inArrayCalls[i]?.column === column) {
      return inArrayCalls[i]?.values;
    }
  }
  return undefined;
}

function createFilteringSelectMock(seed: Seed) {
  mocks.mockSelect.mockImplementation(() => {
    let fromTable: unknown;

    const resolveRows = (): Record<string, unknown>[] => {
      if (fromTable === posOrders) {
        const orgId = lastEqValue(posOrders.orgId);
        expect(orgId).toBeDefined();
        return seed.orders.filter((row) => row.orgId === orgId);
      }
      if (fromTable === posOrderLines) {
        const orgId = lastEqValue(posOrderLines.orgId);
        expect(orgId).toBeDefined();
        const orderIds = lastInArrayValues(posOrderLines.orderId);
        return seed.orderLines.filter((row) => {
          if (row.orgId !== orgId) return false;
          if (!orderIds) return true;
          return orderIds.includes(row.orderId);
        });
      }
      if (fromTable === posReceipts) {
        const orgId = lastEqValue(posReceipts.orgId);
        expect(orgId).toBeDefined();
        return seed.receipts.filter((row) => row.orgId === orgId);
      }
      if (fromTable === posSalePayments) {
        const orgId = lastEqValue(posSalePayments.orgId);
        expect(orgId).toBeDefined();
        let rows = seed.payments.filter((row) => row.orgId === orgId);
        const deviceIds = lastInArrayValues(posSalePayments.deviceId);
        if (deviceIds) {
          rows = rows.filter((row) => deviceIds.includes(row.deviceId));
        }
        const localOrderIds = lastInArrayValues(posSalePayments.localOrderId);
        if (localOrderIds) {
          rows = rows.filter((row) => localOrderIds.includes(row.localOrderId));
        }
        const localReceiptIds = lastInArrayValues(posSalePayments.localReceiptId);
        if (localReceiptIds) {
          rows = rows.filter((row) =>
            localReceiptIds.includes(row.localReceiptId),
          );
        }
        return rows;
      }
      if (fromTable === posReceiptEvents) {
        const orgId = lastEqValue(posReceiptEvents.orgId);
        expect(orgId).toBeDefined();
        return seed.receiptEvents
          .filter((row) => row.orgId === orgId)
          .map((row) => ({
            id: row.id,
            eventId: row.eventId,
            receiptId: row.receiptId,
            localReceiptId: row.localReceiptId,
            sourceDeviceId: row.deviceId,
            eventType: row.eventType,
            occurredAt: row.occurredAt,
            createdAt: row.createdAt,
            metadata: row.payload ?? {},
          }));
      }
      if (fromTable === posShifts) {
        const orgId = lastEqValue(posShifts.orgId);
        expect(orgId).toBeDefined();
        return seed.shifts.filter((row) => row.orgId === orgId);
      }
      return [];
    };

    const chain = {
      from: vi.fn((table: unknown) => {
        fromTable = table;
        return chain;
      }),
      leftJoin: vi.fn(() => chain),
      where: vi.fn(() => chain),
      orderBy: vi.fn(() => chain),
      limit: vi.fn(async (count: number) => resolveRows().slice(0, count)),
      then: (resolve: (value: unknown[]) => unknown) => {
        resolve(resolveRows());
      },
    };
    return chain;
  });
}

function emptyRequest(limit = 50) {
  return {
    schemaVersion: 1 as const,
    deviceId: DEVICE_A,
    licenseKey: "CSTY-LICENSE",
    cursors: {
      orders: null,
      receipts: null,
      payments: null,
      receiptEvents: null,
      shifts: null,
    },
    limit,
  };
}

function baseOrder(
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  return {
    customerId: authA.customerId,
    status: "closed",
    totalCents: 1000,
    currency: "EUR",
    soldAt: new Date("2026-07-27T10:00:00.000Z"),
    platform: null,
    providerOrderId: null,
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    deliveryAddress: null,
    customerNote: null,
    paymentStatus: "paid",
    syncBatchId: null,
    createdAt: new Date("2026-07-27T10:00:00.000Z"),
    updatedAt: new Date("2026-07-27T10:00:00.000Z"),
    ...overrides,
  };
}

describe("PosPullService acceptance fixes", () => {
  const service = new PosPullService();

  beforeEach(() => {
    vi.clearAllMocks();
    eqCalls.length = 0;
    inArrayCalls.length = 0;
  });

  it("excludes every entity type from a foreign orgId", async () => {
    createFilteringSelectMock({
      orders: [
        baseOrder({
          id: "10000000-0000-0000-0000-000000000001",
          orgId: ORG_A,
          deviceId: DEVICE_A,
          localOrderId: "order-a",
        }),
        baseOrder({
          id: "10000000-0000-0000-0000-000000000099",
          orgId: ORG_B,
          deviceId: DEVICE_OTHER_ORG,
          localOrderId: "order-b",
        }),
      ],
      orderLines: [
        {
          id: "20000000-0000-0000-0000-000000000001",
          orderId: "10000000-0000-0000-0000-000000000001",
          orgId: ORG_A,
          lineIndex: 0,
          productName: "A",
          sku: null,
          quantity: 1,
          unitPriceCents: 1000,
          lineTotalCents: 1000,
          taxRateBps: null,
          createdAt: new Date("2026-07-27T10:00:00.000Z"),
        },
        {
          id: "20000000-0000-0000-0000-000000000099",
          orderId: "10000000-0000-0000-0000-000000000099",
          orgId: ORG_B,
          lineIndex: 0,
          productName: "FOREIGN",
          sku: null,
          quantity: 1,
          unitPriceCents: 9999,
          lineTotalCents: 9999,
          taxRateBps: null,
          createdAt: new Date("2026-07-27T10:00:00.000Z"),
        },
      ],
      receipts: [
        {
          id: "40000000-0000-0000-0000-000000000001",
          orgId: ORG_A,
          customerId: authA.customerId,
          deviceId: DEVICE_A,
          localReceiptId: "rcpt-a",
          localOrderId: "order-a",
          receiptNumber: "R1",
          netCents: 840,
          taxCents: 160,
          grossCents: 1000,
          currency: "EUR",
          fiscalStatus: "pending",
          status: "active",
          soldAt: new Date("2026-07-27T10:00:00.000Z"),
          syncBatchId: null,
          createdAt: new Date("2026-07-27T10:00:00.000Z"),
          updatedAt: new Date("2026-07-27T10:00:00.000Z"),
        },
        {
          id: "40000000-0000-0000-0000-000000000099",
          orgId: ORG_B,
          customerId: null,
          deviceId: DEVICE_OTHER_ORG,
          localReceiptId: "rcpt-b",
          localOrderId: "order-b",
          receiptNumber: "RB",
          netCents: 1,
          taxCents: 0,
          grossCents: 1,
          currency: "EUR",
          fiscalStatus: "pending",
          status: "active",
          soldAt: new Date("2026-07-27T10:00:00.000Z"),
          syncBatchId: null,
          createdAt: new Date("2026-07-27T10:00:00.000Z"),
          updatedAt: new Date("2026-07-27T10:00:00.000Z"),
        },
      ],
      payments: [
        {
          id: "30000000-0000-0000-0000-000000000001",
          orgId: ORG_A,
          customerId: authA.customerId,
          deviceId: DEVICE_A,
          localPaymentId: "pay-a",
          localOrderId: "order-a",
          localReceiptId: "rcpt-a",
          method: "card",
          amountCents: 1000,
          currency: "EUR",
          paidAt: new Date("2026-07-27T10:01:00.000Z"),
          syncBatchId: null,
          createdAt: new Date("2026-07-27T10:01:00.000Z"),
          updatedAt: new Date("2026-07-27T10:01:00.000Z"),
        },
        {
          id: "30000000-0000-0000-0000-000000000099",
          orgId: ORG_B,
          customerId: null,
          deviceId: DEVICE_OTHER_ORG,
          localPaymentId: "pay-b",
          localOrderId: "order-b",
          localReceiptId: "rcpt-b",
          method: "cash",
          amountCents: 1,
          currency: "EUR",
          paidAt: new Date("2026-07-27T10:01:00.000Z"),
          syncBatchId: null,
          createdAt: new Date("2026-07-27T10:01:00.000Z"),
          updatedAt: new Date("2026-07-27T10:01:00.000Z"),
        },
      ],
      receiptEvents: [
        {
          id: "50000000-0000-0000-0000-000000000001",
          orgId: ORG_A,
          deviceId: DEVICE_A,
          receiptId: "40000000-0000-0000-0000-000000000001",
          localReceiptId: "rcpt-a",
          eventId: "60000000-0000-0000-0000-000000000001",
          eventType: "created",
          occurredAt: new Date("2026-07-27T10:02:00.000Z"),
          createdAt: new Date("2026-07-27T10:02:00.000Z"),
          payload: {},
        },
        {
          id: "50000000-0000-0000-0000-000000000099",
          orgId: ORG_B,
          deviceId: DEVICE_OTHER_ORG,
          receiptId: "40000000-0000-0000-0000-000000000099",
          localReceiptId: "rcpt-b",
          eventId: "60000000-0000-0000-0000-000000000099",
          eventType: "created",
          occurredAt: new Date("2026-07-27T10:02:00.000Z"),
          createdAt: new Date("2026-07-27T10:02:00.000Z"),
          payload: {},
        },
      ],
      shifts: [
        {
          id: "70000000-0000-0000-0000-000000000001",
          orgId: ORG_A,
          customerId: authA.customerId,
          deviceId: DEVICE_A,
          localShiftId: "shift-a",
          status: "open",
          cashier: "Anna",
          businessDate: "2026-07-27",
          startedAt: new Date("2026-07-27T08:00:00.000Z"),
          endedAt: null,
          openingFloatMinor: 1000,
          closingFloatMinor: null,
          previousClosingFloatMinor: null,
          currency: "EUR",
          schemaVersion: 1,
          syncBatchId: null,
          createdAt: new Date("2026-07-27T08:00:00.000Z"),
          updatedAt: new Date("2026-07-27T08:00:00.000Z"),
        },
        {
          id: "70000000-0000-0000-0000-000000000099",
          orgId: ORG_B,
          customerId: null,
          deviceId: DEVICE_OTHER_ORG,
          localShiftId: "shift-b",
          status: "open",
          cashier: "Bob",
          businessDate: "2026-07-27",
          startedAt: new Date("2026-07-27T08:00:00.000Z"),
          endedAt: null,
          openingFloatMinor: 1,
          closingFloatMinor: null,
          previousClosingFloatMinor: null,
          currency: "EUR",
          schemaVersion: 1,
          syncBatchId: null,
          createdAt: new Date("2026-07-27T08:00:00.000Z"),
          updatedAt: new Date("2026-07-27T08:00:00.000Z"),
        },
      ],
    });

    const result = await service.pullChanges(emptyRequest(), authA);

    expect(result.changes.orders.map((o) => o.id)).toEqual([
      "10000000-0000-0000-0000-000000000001",
    ]);
    expect(result.changes.orders[0]?.lines.map((l) => l.productName)).toEqual([
      "A",
    ]);
    expect(result.changes.receipts.map((r) => r.id)).toEqual([
      "40000000-0000-0000-0000-000000000001",
    ]);
    expect(result.changes.payments.map((p) => p.id)).toEqual([
      "30000000-0000-0000-0000-000000000001",
    ]);
    expect(result.changes.receiptEvents.map((e) => e.id)).toEqual([
      "50000000-0000-0000-0000-000000000001",
    ]);
    expect(result.changes.shifts.map((s) => s.id)).toEqual([
      "70000000-0000-0000-0000-000000000001",
    ]);

    expect(eqCalls.some((c) => c.column === posOrders.orgId && c.value === ORG_A)).toBe(
      true,
    );
    expect(eqCalls.some((c) => c.value === ORG_B)).toBe(false);
  });

  it("includes cross-device data within the same orgId", async () => {
    createFilteringSelectMock({
      orders: [
        baseOrder({
          id: "10000000-0000-0000-0000-000000000001",
          orgId: ORG_A,
          deviceId: DEVICE_A,
          localOrderId: "order-a",
          updatedAt: new Date("2026-07-27T10:00:00.000Z"),
        }),
        baseOrder({
          id: "10000000-0000-0000-0000-000000000002",
          orgId: ORG_A,
          deviceId: DEVICE_B,
          localOrderId: "order-b",
          updatedAt: new Date("2026-07-27T10:01:00.000Z"),
        }),
      ],
      orderLines: [],
      receipts: [],
      payments: [],
      receiptEvents: [],
      shifts: [],
    });

    const result = await service.pullChanges(emptyRequest(), authA);

    expect(result.changes.orders).toHaveLength(2);
    expect(result.changes.orders.map((o) => o.sourceDeviceId).sort()).toEqual([
      DEVICE_A,
      DEVICE_B,
    ]);
  });

  it("keeps paymentMethod and receipt localPaymentId device-scoped for identical local ids", async () => {
    createFilteringSelectMock({
      orders: [
        baseOrder({
          id: "10000000-0000-0000-0000-000000000001",
          orgId: ORG_A,
          deviceId: DEVICE_A,
          localOrderId: "100",
          updatedAt: new Date("2026-07-27T10:00:00.000Z"),
        }),
        baseOrder({
          id: "10000000-0000-0000-0000-000000000002",
          orgId: ORG_A,
          deviceId: DEVICE_B,
          localOrderId: "100",
          updatedAt: new Date("2026-07-27T10:01:00.000Z"),
        }),
      ],
      orderLines: [],
      receipts: [
        {
          id: "40000000-0000-0000-0000-000000000001",
          orgId: ORG_A,
          customerId: authA.customerId,
          deviceId: DEVICE_A,
          localReceiptId: "100",
          localOrderId: "100",
          receiptNumber: "RA",
          netCents: 840,
          taxCents: 160,
          grossCents: 1000,
          currency: "EUR",
          fiscalStatus: "pending",
          status: "active",
          soldAt: new Date("2026-07-27T10:00:00.000Z"),
          syncBatchId: null,
          createdAt: new Date("2026-07-27T10:00:00.000Z"),
          updatedAt: new Date("2026-07-27T10:00:00.000Z"),
        },
        {
          id: "40000000-0000-0000-0000-000000000002",
          orgId: ORG_A,
          customerId: authA.customerId,
          deviceId: DEVICE_B,
          localReceiptId: "100",
          localOrderId: "100",
          receiptNumber: "RB",
          netCents: 840,
          taxCents: 160,
          grossCents: 1000,
          currency: "EUR",
          fiscalStatus: "pending",
          status: "active",
          soldAt: new Date("2026-07-27T10:01:00.000Z"),
          syncBatchId: null,
          createdAt: new Date("2026-07-27T10:01:00.000Z"),
          updatedAt: new Date("2026-07-27T10:01:00.000Z"),
        },
      ],
      payments: [
        {
          id: "30000000-0000-0000-0000-000000000001",
          orgId: ORG_A,
          customerId: authA.customerId,
          deviceId: DEVICE_A,
          localPaymentId: "pay-a",
          localOrderId: "100",
          localReceiptId: "100",
          method: "cash",
          amountCents: 1000,
          currency: "EUR",
          paidAt: new Date("2026-07-27T10:00:30.000Z"),
          syncBatchId: null,
          createdAt: new Date("2026-07-27T10:00:30.000Z"),
          updatedAt: new Date("2026-07-27T10:00:30.000Z"),
        },
        {
          id: "30000000-0000-0000-0000-000000000002",
          orgId: ORG_A,
          customerId: authA.customerId,
          deviceId: DEVICE_B,
          localPaymentId: "pay-b",
          localOrderId: "100",
          localReceiptId: "100",
          method: "card",
          amountCents: 1000,
          currency: "EUR",
          paidAt: new Date("2026-07-27T11:00:00.000Z"),
          syncBatchId: null,
          createdAt: new Date("2026-07-27T11:00:00.000Z"),
          updatedAt: new Date("2026-07-27T11:00:00.000Z"),
        },
      ],
      receiptEvents: [],
      shifts: [],
    });

    const result = await service.pullChanges(emptyRequest(), authA);

    const orderA = result.changes.orders.find((o) => o.sourceDeviceId === DEVICE_A);
    const orderB = result.changes.orders.find((o) => o.sourceDeviceId === DEVICE_B);
    expect(orderA?.paymentMethod).toBe("cash");
    expect(orderB?.paymentMethod).toBe("card");

    const receiptA = result.changes.receipts.find(
      (r) => r.sourceDeviceId === DEVICE_A,
    );
    const receiptB = result.changes.receipts.find(
      (r) => r.sourceDeviceId === DEVICE_B,
    );
    expect(receiptA?.localPaymentId).toBe("pay-a");
    expect(receiptB?.localPaymentId).toBe("pay-b");
  });

  it("does not embed foreign-org order lines even when order ids collide in seed", async () => {
    const sharedOrderId = "10000000-0000-0000-0000-000000000001";
    createFilteringSelectMock({
      orders: [
        baseOrder({
          id: sharedOrderId,
          orgId: ORG_A,
          deviceId: DEVICE_A,
          localOrderId: "order-a",
        }),
      ],
      orderLines: [
        {
          id: "20000000-0000-0000-0000-000000000001",
          orderId: sharedOrderId,
          orgId: ORG_A,
          lineIndex: 0,
          productName: "OK",
          sku: null,
          quantity: 1,
          unitPriceCents: 1000,
          lineTotalCents: 1000,
          taxRateBps: null,
          createdAt: new Date("2026-07-27T10:00:00.000Z"),
        },
        {
          id: "20000000-0000-0000-0000-000000000099",
          orderId: sharedOrderId,
          orgId: ORG_B,
          lineIndex: 0,
          productName: "FOREIGN",
          sku: null,
          quantity: 9,
          unitPriceCents: 9,
          lineTotalCents: 9,
          taxRateBps: null,
          createdAt: new Date("2026-07-27T10:00:00.000Z"),
        },
      ],
      receipts: [],
      payments: [],
      receiptEvents: [],
      shifts: [],
    });

    const result = await service.pullChanges(emptyRequest(), authA);
    expect(result.changes.orders[0]?.lines).toHaveLength(1);
    expect(result.changes.orders[0]?.lines[0]?.productName).toBe("OK");
  });

  it("throws InvalidPullCursorError instead of treating bad cursor as initial page", async () => {
    createFilteringSelectMock({
      orders: [],
      orderLines: [],
      receipts: [],
      payments: [],
      receiptEvents: [],
      shifts: [],
    });

    await expect(
      service.pullChanges(
        {
          ...emptyRequest(),
          cursors: {
            ...emptyRequest().cursors,
            orders: "not-a-valid-cursor",
          },
        },
        authA,
      ),
    ).rejects.toBeInstanceOf(InvalidPullCursorError);
  });

  it("keeps repeated requests deterministic with a valid cursor", async () => {
    const cursor = encodePullCursor({
      timestamp: "2026-07-27T10:00:00.000Z",
      id: "10000000-0000-0000-0000-000000000001",
    });

    createFilteringSelectMock({
      orders: [
        baseOrder({
          id: "10000000-0000-0000-0000-000000000002",
          orgId: ORG_A,
          deviceId: DEVICE_A,
          localOrderId: "order-2",
          updatedAt: new Date("2026-07-27T10:05:00.000Z"),
        }),
      ],
      orderLines: [],
      receipts: [],
      payments: [],
      receiptEvents: [],
      shifts: [],
    });

    const request = {
      ...emptyRequest(),
      cursors: {
        ...emptyRequest().cursors,
        orders: cursor,
      },
    };

    const first = await service.pullChanges(request, authA);
    eqCalls.length = 0;
    inArrayCalls.length = 0;
    const second = await service.pullChanges(request, authA);
    expect(first.changes.orders).toEqual(second.changes.orders);
  });
});
