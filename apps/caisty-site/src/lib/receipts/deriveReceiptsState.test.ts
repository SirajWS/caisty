import { describe, expect, it } from "vitest";

import { deriveReceiptsState } from "./deriveReceiptsState";
import { portalEn } from "../translations/portal/en";

const t = { ...portalEn, labels: portalEn.labels };

const baseReceipt = {
  id: "rcpt-1",
  localReceiptId: "local-1",
  receiptNumber: "R-100",
  issuedAt: "2026-07-14T10:00:00.000Z",
  customer: null,
  paymentMethod: "cash",
  status: "active" as const,
  fiscalStatus: "pending",
  amountCents: 5000,
  currency: "EUR",
  items: [],
  deviceName: "Till 1",
  printCount: 1,
  reprintCount: 0,
  lastEventType: "printed",
  lastEventAt: "2026-07-14T10:01:00.000Z",
  cashier: "Anna",
};

describe("deriveReceiptsState", () => {
  it("maps receipt rows with status and print metadata", () => {
    const state = deriveReceiptsState({
      data: {
        customer: { id: "c1", email: "a@b.com", name: "Test" } as never,
        page: {
          timezone: "Europe/Berlin",
          period: "today",
          summary: {
            receiptsCount: 1,
            activeCount: 1,
            printedCount: 1,
            reprintedCount: 0,
            refundsCount: 0,
            posRevenueCents: 164000,
            paymentSummary: {
              cashCents: 164000,
              cardCents: 0,
              voucherCents: 0,
              otherCents: 0,
              currency: "TND",
            },
          },
          receipts: [baseReceipt],
          pagination: {
            total: 1,
            limit: 5,
            offset: 0,
            page: 1,
            totalPages: 1,
          },
        },
        detail: null,
        detailReceiptId: null,
        detailLoading: false,
        loading: false,
        error: false,
        lastSyncedAt: null,
      },
      t,
      locale: "en-US",
    });

    expect(state.receipts).toHaveLength(1);
    expect(state.receipts[0]?.status).toBe("Active");
    expect(state.receipts[0]?.printCount).toBe("1");
    expect(state.receipts[0]?.lastEvent).toBe("Printed");
    expect(state.summary.find((k) => k.id === "receipts_today")?.value).toBe("1");
    expect(state.summary.find((k) => k.id === "pos_revenue")?.value).toContain("164.000");
  });

  it("maps receipt events chronologically in detail state", () => {
    const state = deriveReceiptsState({
      data: {
        customer: { id: "c1", email: "a@b.com", name: "Test" } as never,
        page: {
          timezone: "Europe/Berlin",
          period: "today",
          summary: {
            receiptsCount: 1,
            activeCount: 1,
            printedCount: 1,
            reprintedCount: 1,
            refundsCount: 0,
            posRevenueCents: 164000,
            paymentSummary: {
              cashCents: 5000,
              cardCents: 0,
              voucherCents: 0,
              otherCents: 0,
              currency: "EUR",
            },
          },
          receipts: [baseReceipt],
          pagination: {
            total: 1,
            limit: 5,
            offset: 0,
            page: 1,
            totalPages: 1,
          },
        },
        detail: {
          receipt: {
            ...baseReceipt,
            localOrderId: "ord-1",
            netCents: 4200,
            taxCents: 800,
            grossCents: 5000,
          },
          events: [
            {
              id: "e1",
              receiptId: "rcpt-1",
              eventType: "created",
              occurredAt: "2026-07-14T10:00:00.000Z",
              actor: null,
              payload: {},
              schemaVersion: 1,
            },
            {
              id: "e2",
              receiptId: "rcpt-1",
              eventType: "printed",
              occurredAt: "2026-07-14T10:01:00.000Z",
              actor: "Anna",
              payload: {},
              schemaVersion: 1,
            },
          ],
          printStats: {
            hasOriginalPrint: true,
            reprintCount: 0,
            lastPrintAt: "2026-07-14T10:01:00.000Z",
          },
          timeline: [
            {
              id: "e1",
              kind: "created",
              label: "Created",
              occurredAt: "2026-07-14T10:00:00.000Z",
              actor: null,
              summary: null,
            },
            {
              id: "e2",
              kind: "printed",
              label: "Printed",
              occurredAt: "2026-07-14T10:01:00.000Z",
              actor: "Anna",
              summary: null,
            },
          ],
          refundSummary: {
            originalAmountCents: 5000,
            refundedAmountCents: 0,
            refundableAmountCents: 5000,
            currency: "EUR",
          },
          hasPaymentChange: false,
        },
        detailReceiptId: "rcpt-1",
        detailLoading: false,
        loading: false,
        error: false,
        lastSyncedAt: null,
      },
      t,
      locale: "en-US",
    });

    expect(state.events.map((e) => e.label)).toEqual(["Created", "Printed"]);
    expect(state.printStats.originalPrint).toBe("Yes");
    expect(state.printStats.reprintCount).toBe("0");
    expect(state.summary).toHaveLength(6);
  });
});
