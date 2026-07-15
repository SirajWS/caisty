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

function chainSelect(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
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
  ) => Promise<{ status: string }>;
  upsertPayment: (
    payload: {
      localPaymentId: string;
      localOrderId?: string;
      method: string;
      amountCents: number;
      paidAt: string;
    },
    authCtx: typeof auth,
    batchId: string,
  ) => Promise<{ status: string }>;
};

describe("PosSyncService entity upserts", () => {
  const service = new PosSyncService() as ServiceInternals;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upsertOrder preserves delivered over stale accepted", async () => {
    chainSelect([{ status: "delivered", paymentStatus: "paid" }]);
    chainInsertOrderConflict();
    const update = chainUpdate();

    const result = await service.upsertOrder(
      {
        localOrderId: "order-1",
        status: "accepted",
        paymentStatus: "pending",
        totalCents: 1200,
        soldAt: "2026-07-14T12:00:00.000Z",
      },
      auth,
      "batch-1",
    );

    expect(result.status).toBe("accepted");
    expect(update.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "delivered",
        paymentStatus: "paid",
      }),
    );
  });

  it("upsertPayment updates existing row on conflict", async () => {
    chainSelect([{ method: "card" }]);
    chainInsertPaymentConflict();
    const update = chainUpdate();

    const result = await service.upsertPayment(
      {
        localPaymentId: "pay-1",
        localOrderId: "order-1",
        method: "unknown",
        amountCents: 1200,
        paidAt: "2026-07-14T12:05:00.000Z",
      },
      auth,
      "batch-1",
    );

    expect(result.status).toBe("accepted");
    expect(update.set).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "card",
        amountCents: 1200,
      }),
    );
  });
});
