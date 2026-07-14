import { describe, expect, it } from "vitest";

import { buildAdminReceiptTimeline } from "../adminReceiptTimeline.js";
import { buildPortalReceiptTimeline } from "../portalReceiptTimeline.js";
import {
  computeRefundedAmountCents,
  computeRefundableAmountCents,
  sanitizeEventForPortal,
} from "../receiptEventPayload.js";
import { RECEIPT_EVENT_TYPES } from "../receiptEventTypes.js";

describe("receipt event payload", () => {
  it("sums refund event amounts", () => {
    const total = computeRefundedAmountCents([
      {
        eventType: RECEIPT_EVENT_TYPES.PARTIAL_REFUND,
        payload: { amountCents: 300 },
      },
      {
        eventType: RECEIPT_EVENT_TYPES.REFUND,
        payload: { amountCents: 700 },
      },
    ]);
    expect(total).toBe(1000);
  });

  it("computes refundable remainder", () => {
    expect(computeRefundableAmountCents(1000, 400)).toBe(600);
  });

  it("strips internal notes for portal", () => {
    const sanitized = sanitizeEventForPortal({
      id: "evt-1",
      receiptId: "rec-1",
      eventType: RECEIPT_EVENT_TYPES.PAYMENT_CHANGED,
      occurredAt: "2026-07-14T12:00:00.000Z",
      actor: "admin@caisty.com",
      payload: {
        internalNote: "secret",
        adminUserId: "admin-1",
        previousMethod: "cash",
        newMethod: "card",
      },
      schemaVersion: 1,
    });

    expect(sanitized.payload.internalNote).toBeUndefined();
    expect(sanitized.payload.adminUserId).toBeUndefined();
    expect(sanitized.payload.previousMethod).toBe("cash");
  });
});

describe("buildAdminReceiptTimeline", () => {
  it("sorts events chronologically without duplicate created", () => {
    const soldAt = new Date("2026-07-14T10:00:00.000Z");
    const timeline = buildAdminReceiptTimeline({
      soldAt,
      events: [
        {
          id: "e1",
          receiptId: "rec-1",
          eventType: RECEIPT_EVENT_TYPES.CREATED,
          occurredAt: "2026-07-14T10:00:00.000Z",
          actor: "Anna",
          payload: {},
          schemaVersion: 1,
        },
        {
          id: "e2",
          receiptId: "rec-1",
          eventType: RECEIPT_EVENT_TYPES.PAYMENT_CHANGED,
          occurredAt: "2026-07-14T10:10:00.000Z",
          actor: "Admin",
          payload: {
            previousMethod: "cash",
            newMethod: "card",
          },
          schemaVersion: 1,
        },
        {
          id: "e3",
          receiptId: "rec-1",
          eventType: RECEIPT_EVENT_TYPES.PARTIAL_REFUND,
          occurredAt: "2026-07-14T10:18:00.000Z",
          actor: "Admin",
          payload: {
            amountCents: 500,
            reasonCode: "wrong_item",
          },
          schemaVersion: 1,
        },
      ],
    });

    expect(timeline.map((entry) => entry.kind)).toEqual([
      "created",
      "payment_changed",
      "partial_refund",
    ]);
    expect(timeline.filter((entry) => entry.kind === "created")).toHaveLength(1);
    expect(timeline[1]?.previousValue).toBe("Cash");
    expect(timeline[1]?.newValue).toBe("Card");
    expect(timeline[2]?.amountCents).toBe(500);
  });

  it("falls back to soldAt when created event is missing", () => {
    const soldAt = new Date("2026-07-14T12:02:00.000Z");
    const timeline = buildAdminReceiptTimeline({ soldAt, events: [] });
    expect(timeline).toHaveLength(1);
    expect(timeline[0]?.kind).toBe("created");
    expect(timeline[0]?.occurredAt).toBe(soldAt.toISOString());
  });
});

describe("buildPortalReceiptTimeline", () => {
  it("includes payment change summary without internal notes", () => {
    const timeline = buildPortalReceiptTimeline({
      soldAt: new Date("2026-07-14T10:00:00.000Z"),
      currency: "EUR",
      events: [
        {
          id: "e1",
          receiptId: "rec-1",
          eventType: RECEIPT_EVENT_TYPES.CREATED,
          occurredAt: "2026-07-14T10:00:00.000Z",
          actor: "Anna",
          payload: {},
          schemaVersion: 1,
        },
        {
          id: "e2",
          receiptId: "rec-1",
          eventType: RECEIPT_EVENT_TYPES.PAYMENT_CHANGED,
          occurredAt: "2026-07-14T10:10:00.000Z",
          actor: "Admin",
          payload: {
            previousMethod: "cash",
            newMethod: "card",
            internalNote: "secret",
          },
          schemaVersion: 1,
        },
      ],
    });

    expect(timeline.some((entry) => entry.kind === "payment_changed")).toBe(true);
    const paymentChange = timeline.find((entry) => entry.kind === "payment_changed");
    expect(paymentChange?.summary).toContain("Cash");
    expect(paymentChange?.summary).toContain("Card");
  });
});
