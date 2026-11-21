import { describe, expect, it } from "vitest";

import { RECEIPT_EVENT_TYPES } from "../receiptEventTypes.js";
import { PORTAL_PRINT_STATUS, aggregateReceiptLifecycle } from "../receiptPrintDisplay.js";

describe("receipt print stats derivation", () => {
  it("counts reprints and tracks last print from events only", () => {
    const display = aggregateReceiptLifecycle([
      { eventType: RECEIPT_EVENT_TYPES.CREATED, occurredAt: "2026-07-14T10:00:00.000Z" },
      { eventType: RECEIPT_EVENT_TYPES.PRINTED, occurredAt: "2026-07-14T10:01:00.000Z" },
      { eventType: RECEIPT_EVENT_TYPES.REPRINTED, occurredAt: "2026-07-14T10:05:00.000Z" },
      { eventType: RECEIPT_EVENT_TYPES.REPRINTED, occurredAt: "2026-07-14T10:10:00.000Z" },
    ]);

    expect(display.hasOriginalPrint).toBe(true);
    expect(display.reprintCount).toBe(2);
    expect(display.printStatus).toBe(PORTAL_PRINT_STATUS.REPRINT_REQUESTED);
    expect(display.lastPrintAt).toBe("2026-07-14T10:10:00.000Z");
  });
});
