import { describe, expect, it } from "vitest";

import { mapPortalReceiptRecord } from "../portalReceipts.js";
import { RECEIPT_STATUS } from "../receiptStatus.js";

describe("mapPortalReceiptRecord", () => {
  const baseRow = {
    id: "rcpt-uuid",
    deviceId: "dev-1",
    localReceiptId: "local-rcpt-1",
    receiptNumber: "R-001",
    soldAt: new Date("2026-07-14T10:00:00.000Z"),
    grossCents: 8000,
    currency: "TND",
    fiscalStatus: "pending",
    status: "active",
    localOrderId: "local-order-1",
  };

  it("maps DB row to portal receipt with status active", () => {
    const mapped = mapPortalReceiptRecord({
      row: baseRow,
      paymentMethod: "cash",
      items: [],
    });

    expect(mapped.status).toBe(RECEIPT_STATUS.ACTIVE);
    expect(mapped.issuedAt).toBe("2026-07-14T10:00:00.000Z");
    expect(mapped.amountCents).toBe(8000);
    expect(mapped.paymentMethod).toBe("cash");
  });

  it("normalizes missing status to active", () => {
    const mapped = mapPortalReceiptRecord({
      row: { ...baseRow, status: null },
      paymentMethod: null,
      items: [],
    });

    expect(mapped.status).toBe(RECEIPT_STATUS.ACTIVE);
  });
});
