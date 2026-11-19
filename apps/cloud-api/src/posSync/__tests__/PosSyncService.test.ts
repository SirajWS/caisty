import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  return { mockSelect, mockInsert, mockUpdate };
});

vi.mock("../../db/client.js", () => ({
  db: {
    select: mocks.mockSelect,
    insert: mocks.mockInsert,
    update: mocks.mockUpdate,
    transaction: async (fn: (tx: typeof mocks) => unknown) =>
      fn({
        select: mocks.mockSelect,
        insert: mocks.mockInsert,
        update: mocks.mockUpdate,
      }),
  },
}));

vi.mock("../../billing/IdempotencyService.js", () => ({
  IdempotencyService: class {
    hash() {
      return "hash";
    }
    async get() {
      return { hit: false };
    }
    async set() {}
  },
}));

vi.mock("../../lib/receiptEventService.js", () => ({
  receiptEventService: {
    findReceiptByLocalId: vi.fn(),
    appendEvent: vi.fn(),
  },
}));

vi.mock("../../lib/shiftService.js", () => ({
  shiftService: {
    upsertShiftSnapshot: vi.fn(),
  },
}));

import { PosSyncService } from "../PosSyncService.js";

const auth = {
  orgId: "11111111-1111-1111-1111-111111111111",
  customerId: "22222222-2222-2222-2222-222222222222",
  deviceId: "33333333-3333-3333-3333-333333333333",
};

function chainSelect(rows: unknown[], terminal: "limit" | "where" = "limit") {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where:
      terminal === "where"
        ? vi.fn().mockResolvedValue(rows)
        : vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
  mocks.mockSelect.mockReturnValue(chain);
  return chain;
}

function chainInsertOrderConflict() {
  const returning = vi.fn().mockRejectedValue({ code: "23505" });
  const values = vi.fn().mockReturnValue({ returning });
  mocks.mockInsert.mockReturnValue({ values });
  return { values, returning };
}

function chainInsertPaymentConflict() {
  const values = vi.fn().mockRejectedValue({ code: "23505" });
  mocks.mockInsert.mockReturnValue({ values });
  return { values };
}

function chainUpdate() {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };
  mocks.mockUpdate.mockReturnValue(chain);
  return chain;
}

type ServiceInternals = PosSyncService & {
  upsertOrder: (
    payload: {
      localOrderId: string;
      status?: string;
      paymentStatus?: string | null;
      totalCents: number;
      soldAt: string;
    },
    authCtx: typeof auth,
    batchId: string,
    businessCurrency: string | null,
  ) => Promise<{ status: string }>;
  upsertPayment: (
    payload: {
      localPaymentId: string;
      localOrderId?: string;
      method: string;
      amountCents: number;
      paidAt: string;
      currency?: string;
    },
    authCtx: typeof auth,
    batchId: string,
    businessCurrency: string | null,
  ) => Promise<{ status: string }>;
};

describe("PosSyncService entity upserts", () => {
  const service = new PosSyncService() as ServiceInternals;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("downgrades unconfirmed paid provider sync orders to pending", async () => {
    chainSelect([]);
    const returningOrder = vi.fn().mockResolvedValue([
      {
        id: "order-pending",
        localOrderId: "T1786060842435",
        paymentStatus: "pending",
      },
    ]);
    mocks.mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: returningOrder }),
    });

    const result = await service.upsertOrder(
      {
        localOrderId: "T1786060842435",
        platform: "fake_delivery",
        providerOrderId: "T1786060842435",
        status: "new",
        paymentStatus: "paid",
        totalCents: 27500,
        currency: "EUR",
        soldAt: "2026-08-07T00:00:42.860Z",
      },
      auth,
      "batch-1",
      "EUR",
    );

    expect(result.status).toBe("accepted");
    const insertCall = mocks.mockInsert.mock.results[0]?.value?.values?.mock?.calls?.[0]?.[0];
    expect(insertCall?.paymentStatus).toBe("pending");
  });

  it("upsertOrder preserves delivered over stale accepted", async () => {
    chainSelect([
      {
        status: "delivered",
        paymentStatus: "paid",
        totalCents: 1200,
        currency: "EUR",
      },
    ]);
    chainInsertOrderConflict();
    const update = chainUpdate();

    const result = await service.upsertOrder(
      {
        localOrderId: "order-1",
        status: "accepted",
        paymentStatus: "pending",
        totalCents: 1200,
        currency: "EUR",
        soldAt: "2026-07-14T12:00:00.000Z",
      },
      auth,
      "batch-1",
      "EUR",
    );

    expect(result.status).toBe("accepted");
    expect(update.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "delivered",
        paymentStatus: "paid",
      }),
    );
    expect(update.set).not.toHaveBeenCalledWith(
      expect.objectContaining({ totalCents: expect.anything() }),
    );
  });

  it("upsertPayment updates existing row on conflict", async () => {
    chainSelect([{ method: "card", amountCents: 1200, currency: "EUR" }]);
    chainInsertPaymentConflict();
    const update = chainUpdate();

    const result = await service.upsertPayment(
      {
        localPaymentId: "pay-1",
        localOrderId: "order-1",
        method: "unknown",
        amountCents: 1200,
        currency: "EUR",
        paidAt: "2026-07-14T12:05:00.000Z",
      },
      auth,
      "batch-1",
      "EUR",
    );

    expect(result.status).toBe("accepted");
    expect(update.set).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "card",
      }),
    );
    expect(update.set).not.toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: 1200 }),
    );
  });

  it("manual cash payment marks linked provider order paid in same transaction", async () => {
    chainSelect([{ deviceId: auth.deviceId, platform: "fake_delivery" }], "where");
    const insertValues = vi.fn().mockResolvedValue(undefined);
    mocks.mockInsert.mockReturnValue({ values: insertValues });
    const orderUpdate = chainUpdate();

    const result = await service.upsertPayment(
      {
        localPaymentId: "RUNTIME-WEBHOOK-1-provider-payment",
        localOrderId: "RUNTIME-WEBHOOK-1",
        method: "cash",
        amountCents: 2750,
        currency: "EUR",
        paidAt: "2026-08-07T12:00:00.000Z",
      },
      auth,
      "batch-cash",
      "EUR",
    );

    expect(result.status).toBe("accepted");
    expect(insertValues).toHaveBeenCalled();
    expect(orderUpdate.set).toHaveBeenCalledWith(
      expect.objectContaining({ paymentStatus: "paid" }),
    );
  });

  it("manual card payment retry does not duplicate payment row", async () => {
    mocks.mockSelect
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          { method: "card", amountCents: 2750, currency: "EUR" },
        ]),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { deviceId: auth.deviceId, platform: "fake_delivery" },
        ]),
      });
    chainInsertPaymentConflict();
    const update = chainUpdate();

    const payload = {
      localPaymentId: "RUNTIME-SYNC-1-provider-payment",
      localOrderId: "RUNTIME-SYNC-1",
      method: "card",
      amountCents: 2750,
      currency: "EUR",
      paidAt: "2026-08-07T12:05:00.000Z",
    };

    const result = await service.upsertPayment(
      payload,
      auth,
      "batch-card-retry",
      "EUR",
    );
    expect(result.status).toBe("accepted");
    expect(update.set).toHaveBeenCalledWith(
      expect.objectContaining({ method: "card" }),
    );
    expect(update.set).toHaveBeenCalledWith(
      expect.objectContaining({ paymentStatus: "paid" }),
    );
  });

  it("provider pending order sync does not downgrade existing paid status", async () => {
    chainSelect([
      {
        status: "new",
        paymentStatus: "paid",
        totalCents: 2750,
        currency: "EUR",
      },
    ]);
    chainInsertOrderConflict();
    const update = chainUpdate();

    const result = await service.upsertOrder(
      {
        localOrderId: "RUNTIME-WEBHOOK-1",
        platform: "fake_delivery",
        providerOrderId: "RUNTIME-WEBHOOK-1",
        status: "new",
        paymentStatus: "pending",
        totalCents: 2750,
        currency: "EUR",
        soldAt: "2026-08-07T12:00:00.000Z",
      },
      auth,
      "batch-overwrite",
      "EUR",
    );

    expect(result.status).toBe("accepted");
    expect(update.set).toHaveBeenCalledWith(
      expect.objectContaining({ paymentStatus: "paid" }),
    );
  });

  it("retries a previously failed financial event instead of treating it as a duplicate", async () => {
    mocks.mockSelect
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: "evt-row", status: "failed" }]),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      });
    mocks.mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "order-retry" }]),
      }),
    });
    const update = chainUpdate();

    const result = await (
      service as ServiceInternals & {
        processEvent: (
          event: {
            eventId: string;
            type: string;
            payload: Record<string, unknown>;
          },
          authCtx: typeof auth,
          batchId: string,
          businessCurrency: string | null,
        ) => Promise<{ status: string }>;
      }
    ).processEvent(
      {
        eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        type: "order",
        payload: {
          localOrderId: "order-retry",
          totalCents: 15000,
          currency: "TND",
          soldAt: "2026-11-19T12:00:00.000Z",
        },
      },
      auth,
      "batch-retry",
      "TND",
    );

    expect(result.status).toBe("accepted");
    expect(update.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "accepted", errorCode: null }),
    );
  });
});
