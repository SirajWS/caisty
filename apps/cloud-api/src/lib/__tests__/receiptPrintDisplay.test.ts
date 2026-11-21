import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { RECEIPT_EVENT_TYPES } from "../receiptEventTypes.js";
import {
  PORTAL_PRINT_STATUS,
  aggregateReceiptLifecycle,
} from "../receiptPrintDisplay.js";

describe("aggregateReceiptLifecycle", () => {
  it("uses the earliest created actor as original cashier", () => {
    const display = aggregateReceiptLifecycle([
      {
        eventType: RECEIPT_EVENT_TYPES.CREATED,
        occurredAt: "2026-11-21T08:00:00.000Z",
        actor: "Register A",
        eventId: "11111111-1111-4111-8111-111111111111",
      },
      {
        eventType: RECEIPT_EVENT_TYPES.PRINTED,
        occurredAt: "2026-11-21T08:01:00.000Z",
        actor: "Register B",
        eventId: "22222222-2222-4222-8222-222222222222",
      },
    ]);

    expect(display.originalCashier).toBe("Register A");
    expect(display.reprintActor).toBe("Register B");
    expect(display.printStatus).toBe(PORTAL_PRINT_STATUS.PRINT_REQUESTED);
  });

  it("does not replace original cashier with a reprinted actor", () => {
    const display = aggregateReceiptLifecycle([
      {
        eventType: RECEIPT_EVENT_TYPES.CREATED,
        occurredAt: "2026-11-21T08:00:00.000Z",
        actor: "Register A",
        eventId: "a",
      },
      {
        eventType: RECEIPT_EVENT_TYPES.REPRINTED,
        occurredAt: "2026-11-21T09:00:00.000Z",
        actor: "Register Z",
        eventId: "b",
      },
    ]);

    expect(display.originalCashier).toBe("Register A");
    expect(display.reprintActor).toBe("Register Z");
    expect(display.printStatus).toBe(PORTAL_PRINT_STATUS.REPRINT_REQUESTED);
  });

  it("keeps two register labels distinct", () => {
    const display = aggregateReceiptLifecycle([
      {
        eventType: RECEIPT_EVENT_TYPES.CREATED,
        occurredAt: "2026-11-21T08:00:00.000Z",
        actor: "Kasse 1",
        eventId: "c1",
      },
      {
        eventType: RECEIPT_EVENT_TYPES.CREATED,
        occurredAt: "2026-11-21T08:00:01.000Z",
        actor: "Kasse 2",
        eventId: "c2",
      },
    ]);

    expect(display.originalCashier).toBe("Kasse 1");
  });

  it("returns no original cashier when no created event exists", () => {
    const display = aggregateReceiptLifecycle([
      {
        eventType: RECEIPT_EVENT_TYPES.PRINTED,
        occurredAt: "2026-11-21T08:01:00.000Z",
        actor: "Register B",
        eventId: "p1",
      },
    ]);

    expect(display.originalCashier).toBeNull();
    expect(display.printStatus).toBe(PORTAL_PRINT_STATUS.PRINT_REQUESTED);
  });

  it("counts print and reprint requests separately", () => {
    const display = aggregateReceiptLifecycle([
      {
        eventType: RECEIPT_EVENT_TYPES.CREATED,
        occurredAt: "2026-11-21T08:00:00.000Z",
        actor: "Register A",
        eventId: "c",
      },
      {
        eventType: RECEIPT_EVENT_TYPES.PRINTED,
        occurredAt: "2026-11-21T08:01:00.000Z",
        eventId: "p",
      },
      {
        eventType: RECEIPT_EVENT_TYPES.REPRINTED,
        occurredAt: "2026-11-21T08:02:00.000Z",
        eventId: "r1",
      },
      {
        eventType: RECEIPT_EVENT_TYPES.REPRINTED,
        occurredAt: "2026-11-21T08:03:00.000Z",
        eventId: "r2",
      },
    ]);

    expect(display.printRequestCount).toBe(1);
    expect(display.reprintRequestCount).toBe(2);
  });

  it("does not increase counts for a duplicate eventId", () => {
    const display = aggregateReceiptLifecycle([
      {
        eventType: RECEIPT_EVENT_TYPES.PRINTED,
        occurredAt: "2026-11-21T08:01:00.000Z",
        eventId: "same-print",
      },
      {
        eventType: RECEIPT_EVENT_TYPES.PRINTED,
        occurredAt: "2026-11-21T08:01:00.000Z",
        eventId: "same-print",
      },
    ]);

    expect(display.printRequestCount).toBe(1);
  });

  it("marks historical receipts without events as unknown", () => {
    const display = aggregateReceiptLifecycle([]);
    expect(display.printStatus).toBe(PORTAL_PRINT_STATUS.UNKNOWN);
    expect(display.originalCashier).toBeNull();
    expect(display.hasEvents).toBe(false);
    expect(display.printRequestCount).toBe(0);
    expect(display.reprintRequestCount).toBe(0);
  });
});

describe("portal receipt detail tenant isolation", () => {
  it("keeps detail lookup scoped to organization and customer", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../portalReceiptsPage.ts"),
      "utf8",
    );
    expect(source).toContain("eq(posReceipts.orgId, orgId)");
    expect(source).toContain("eq(devices.customerId, customerId)");
    expect(source).toContain("eq(posReceipts.id, receiptId)");
    expect(source).toContain("devices.stationCode");
  });
});
