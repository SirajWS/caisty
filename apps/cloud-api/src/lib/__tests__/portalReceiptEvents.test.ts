import { describe, expect, it } from "vitest";

import { mapPortalReceiptEventRecord } from "../portalReceiptEvents.js";
import { RECEIPT_EVENT_TYPES } from "../receiptEventTypes.js";

describe("mapPortalReceiptEventRecord", () => {
  it("maps DB row to portal receipt event DTO", () => {
    const mapped = mapPortalReceiptEventRecord({
      id: "evt-1",
      receiptId: "rcpt-1",
      eventType: RECEIPT_EVENT_TYPES.PRINTED,
      occurredAt: new Date("2026-07-14T10:05:00.000Z"),
      actor: "cashier-1",
      payload: { printerName: "Kitchen" },
      schemaVersion: 1,
    });

    expect(mapped).toEqual({
      id: "evt-1",
      receiptId: "rcpt-1",
      eventType: "printed",
      occurredAt: "2026-07-14T10:05:00.000Z",
      actor: "cashier-1",
      payload: { printerName: "Kitchen" },
      schemaVersion: 1,
    });
  });

  it("defaults invalid payload shapes to empty object", () => {
    const mapped = mapPortalReceiptEventRecord({
      id: "evt-2",
      receiptId: "rcpt-1",
      eventType: RECEIPT_EVENT_TYPES.CREATED,
      occurredAt: new Date("2026-07-14T10:00:00.000Z"),
      actor: null,
      payload: null,
      schemaVersion: 1,
    });

    expect(mapped.payload).toEqual({});
  });
});
