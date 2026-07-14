import { describe, expect, it } from "vitest";

import { RECEIPT_EVENT_TYPES } from "../receiptEventTypes.js";

describe("receipt print stats derivation", () => {
  it("counts reprints and tracks last print from events only", () => {
    const events = [
      { eventType: RECEIPT_EVENT_TYPES.CREATED, occurredAt: "2026-07-14T10:00:00.000Z" },
      { eventType: RECEIPT_EVENT_TYPES.PRINTED, occurredAt: "2026-07-14T10:01:00.000Z" },
      { eventType: RECEIPT_EVENT_TYPES.REPRINTED, occurredAt: "2026-07-14T10:05:00.000Z" },
      { eventType: RECEIPT_EVENT_TYPES.REPRINTED, occurredAt: "2026-07-14T10:10:00.000Z" },
    ];

    let reprintCount = 0;
    let lastPrintAt: string | null = null;
    let hasOriginalPrint = false;

    for (const event of events) {
      if (event.eventType === RECEIPT_EVENT_TYPES.PRINTED) {
        hasOriginalPrint = true;
        lastPrintAt = event.occurredAt;
      }
      if (event.eventType === RECEIPT_EVENT_TYPES.REPRINTED) {
        reprintCount += 1;
        lastPrintAt = event.occurredAt;
      }
    }

    expect(hasOriginalPrint).toBe(true);
    expect(reprintCount).toBe(2);
    expect(lastPrintAt).toBe("2026-07-14T10:10:00.000Z");
  });
});
