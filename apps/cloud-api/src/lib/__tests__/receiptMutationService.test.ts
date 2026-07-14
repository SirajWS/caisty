import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockTransaction = vi.fn();
  return { mockSelect, mockInsert, mockUpdate, mockTransaction };
});

vi.mock("../../db/client.js", () => ({
  db: {
    select: mocks.mockSelect,
    insert: mocks.mockInsert,
    update: mocks.mockUpdate,
    transaction: mocks.mockTransaction,
  },
}));

import {
  changeReceiptPayment,
  deriveChangePaymentActionAvailability,
  deriveRefundActionAvailability,
  refundReceipt,
} from "../receiptMutationService.js";
import { RECEIPT_STATUS } from "../receiptStatus.js";

function makeWhereTerminalChain(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(rows),
  };
}

function makeSelectChain(rows: unknown[], terminal: "limit" | "orderBy" = "limit") {
  const chain = {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockImplementation(function () {
      if (terminal === "orderBy") {
        return Promise.resolve(rows);
      }
      return chain;
    }),
    limit:
      terminal === "limit"
        ? vi.fn().mockResolvedValue(rows)
        : vi.fn().mockReturnThis(),
  };
  return chain;
}

function setupTransaction() {
  mocks.mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
    const tx = {
      insert: mocks.mockInsert,
      update: mocks.mockUpdate,
    };
    mocks.mockInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    mocks.mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    });
    await fn(tx);
  });
}

const baseReceipt = {
  id: "rec-1",
  orgId: "org-1",
  customerId: "cust-1",
  deviceId: "dev-1",
  localReceiptId: "local-rec-1",
  localOrderId: "local-order-1",
  receiptNumber: "R-100",
  grossCents: 1000,
  currency: "EUR",
  status: "active",
};

describe("deriveRefundActionAvailability", () => {
  it("rejects voided receipts", () => {
    const result = deriveRefundActionAvailability({
      status: RECEIPT_STATUS.VOIDED,
      refundableAmountCents: 500,
    });
    expect(result.available).toBe(false);
  });
});

describe("refundReceipt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockSelect.mockReset();
    mocks.mockTransaction.mockReset();
  });

  function mockRefundSelectSequence(eventRows: unknown[] = []) {
    let call = 0;
    mocks.mockSelect.mockImplementation(() => {
      call += 1;
      if (call === 1) return makeSelectChain([], "limit");
      if (call === 2) return makeSelectChain([baseReceipt], "limit");
      return makeWhereTerminalChain(eventRows);
    });
  }

  it("rejects zero amount", async () => {
    const result = await refundReceipt({
      receiptId: "rec-1",
      amountCents: 0,
      reasonCode: "customer_request",
      refundPaymentMethod: "cash",
      idempotencyKey: "00000000-0000-4000-8000-000000000001",
      adminUserId: "admin-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_amount");
  });

  it("rejects over-refund", async () => {
    mockRefundSelectSequence();

    const result = await refundReceipt({
      receiptId: "rec-1",
      amountCents: 1500,
      reasonCode: "customer_request",
      refundPaymentMethod: "cash",
      idempotencyKey: "00000000-0000-4000-8000-000000000002",
      adminUserId: "admin-1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("refund_exceeds_remaining");
  });

  it("accepts partial refund", async () => {
    mockRefundSelectSequence();
    setupTransaction();

    const result = await refundReceipt({
      receiptId: "rec-1",
      amountCents: 400,
      reasonCode: "wrong_item",
      refundPaymentMethod: "card",
      idempotencyKey: "00000000-0000-4000-8000-000000000004",
      adminUserId: "admin-1",
    });

    expect(result.ok).toBe(true);
    expect(mocks.mockTransaction).toHaveBeenCalled();
  });
});

describe("changeReceiptPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects identical payment method", async () => {
    mocks.mockSelect
      .mockReturnValueOnce(makeSelectChain([], "limit"))
      .mockReturnValueOnce(makeSelectChain([baseReceipt], "limit"))
      .mockReturnValueOnce(
        makeSelectChain(
          [
            {
              id: "pay-1",
              method: "cash",
              amountCents: 1000,
              localPaymentId: "local-pay-1",
            },
          ],
          "limit",
        ),
      );

    const result = await changeReceiptPayment({
      receiptId: "rec-1",
      newPaymentMethod: "cash",
      reason: "Correction",
      idempotencyKey: "00000000-0000-4000-8000-000000000005",
      adminUserId: "admin-1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("same_payment_method");
  });

  it("accepts cash to card change", async () => {
    mocks.mockSelect
      .mockReturnValueOnce(makeSelectChain([], "limit"))
      .mockReturnValueOnce(makeSelectChain([baseReceipt], "limit"))
      .mockReturnValueOnce(
        makeSelectChain(
          [
            {
              id: "pay-1",
              method: "cash",
              amountCents: 1000,
              localPaymentId: "local-pay-1",
            },
          ],
          "limit",
        ),
      );
    setupTransaction();

    const result = await changeReceiptPayment({
      receiptId: "rec-1",
      newPaymentMethod: "card",
      reason: "Customer paid by card",
      idempotencyKey: "00000000-0000-4000-8000-000000000006",
      adminUserId: "admin-1",
    });

    expect(result.ok).toBe(true);
    expect(mocks.mockTransaction).toHaveBeenCalled();
  });
});
