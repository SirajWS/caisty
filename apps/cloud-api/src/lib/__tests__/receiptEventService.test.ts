import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  return { mockSelect, mockInsert };
});

vi.mock("../../db/client.js", () => ({
  db: {
    select: mocks.mockSelect,
    insert: mocks.mockInsert,
  },
}));

import { ReceiptEventService } from "../receiptEventService.js";
import { RECEIPT_EVENT_TYPES } from "../receiptEventTypes.js";

function chainSelect(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(rows),
    limit: vi.fn().mockResolvedValue(rows),
  };
  mocks.mockSelect.mockReturnValue(chain);
  return chain;
}

function chainInsert(error?: unknown) {
  const chain = {
    values: error
      ? vi.fn().mockRejectedValue(error)
      : vi.fn().mockResolvedValue(undefined),
  };
  mocks.mockInsert.mockReturnValue(chain);
  return chain;
}

describe("ReceiptEventService", () => {
  const service = new ReceiptEventService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("appends a receipt event", async () => {
    chainInsert();

    const result = await service.appendEvent({
      orgId: "org-1",
      customerId: "cust-1",
      deviceId: "dev-1",
      receiptId: "rcpt-1",
      eventId: "11111111-1111-4111-8111-111111111111",
      eventType: RECEIPT_EVENT_TYPES.CREATED,
      occurredAt: new Date("2026-07-14T10:00:00.000Z"),
      schemaVersion: 1,
    });

    expect(result).toEqual({ status: "accepted" });
    expect(mocks.mockInsert).toHaveBeenCalledOnce();
  });

  it("treats duplicate event_id as duplicate without updating", async () => {
    chainInsert({ code: "23505" });

    const result = await service.appendEvent({
      orgId: "org-1",
      customerId: null,
      deviceId: "dev-1",
      receiptId: "rcpt-1",
      eventId: "11111111-1111-4111-8111-111111111111",
      eventType: RECEIPT_EVENT_TYPES.PRINTED,
      occurredAt: new Date("2026-07-14T10:01:00.000Z"),
      schemaVersion: 1,
    });

    expect(result).toEqual({ status: "duplicate" });
  });

  it("returns receipt events ordered by occurred_at ascending", async () => {
    chainSelect([
      {
        id: "evt-1",
        receiptId: "rcpt-1",
        eventType: RECEIPT_EVENT_TYPES.CREATED,
        occurredAt: new Date("2026-07-14T10:00:00.000Z"),
        actor: null,
        payload: {},
        schemaVersion: 1,
      },
      {
        id: "evt-2",
        receiptId: "rcpt-1",
        eventType: RECEIPT_EVENT_TYPES.PRINTED,
        occurredAt: new Date("2026-07-14T10:05:00.000Z"),
        actor: "cashier",
        payload: {},
        schemaVersion: 1,
      },
      {
        id: "evt-3",
        receiptId: "rcpt-1",
        eventType: RECEIPT_EVENT_TYPES.REPRINTED,
        occurredAt: new Date("2026-07-14T10:10:00.000Z"),
        actor: "cashier",
        payload: {},
        schemaVersion: 1,
      },
    ]);

    const events = await service.fetchReceiptEvents("org-1", "rcpt-1");

    expect(events.map((event) => event.eventType)).toEqual([
      "created",
      "printed",
      "reprinted",
    ]);
  });

  it("computes event summary with print and reprint counts", async () => {
    chainSelect([
      {
        id: "evt-1",
        receiptId: "rcpt-1",
        eventType: RECEIPT_EVENT_TYPES.CREATED,
        occurredAt: new Date("2026-07-14T10:00:00.000Z"),
        actor: null,
        payload: {},
        schemaVersion: 1,
      },
      {
        id: "evt-2",
        receiptId: "rcpt-1",
        eventType: RECEIPT_EVENT_TYPES.PRINTED,
        occurredAt: new Date("2026-07-14T10:05:00.000Z"),
        actor: null,
        payload: {},
        schemaVersion: 1,
      },
      {
        id: "evt-3",
        receiptId: "rcpt-1",
        eventType: RECEIPT_EVENT_TYPES.REPRINTED,
        occurredAt: new Date("2026-07-14T10:10:00.000Z"),
        actor: null,
        payload: {},
        schemaVersion: 1,
      },
      {
        id: "evt-4",
        receiptId: "rcpt-1",
        eventType: RECEIPT_EVENT_TYPES.REPRINTED,
        occurredAt: new Date("2026-07-14T10:15:00.000Z"),
        actor: null,
        payload: {},
        schemaVersion: 1,
      },
    ]);

    const summary = await service.getEventSummary("org-1", "rcpt-1");

    expect(summary.totalEvents).toBe(4);
    expect(summary.printCount).toBe(1);
    expect(summary.reprintCount).toBe(2);
    expect(summary.latestEvent?.eventType).toBe(RECEIPT_EVENT_TYPES.REPRINTED);
  });

  it("returns latest event as the last ordered event", async () => {
    chainSelect([
      {
        id: "evt-1",
        receiptId: "rcpt-1",
        eventType: RECEIPT_EVENT_TYPES.CREATED,
        occurredAt: new Date("2026-07-14T10:00:00.000Z"),
        actor: null,
        payload: {},
        schemaVersion: 1,
      },
      {
        id: "evt-2",
        receiptId: "rcpt-1",
        eventType: RECEIPT_EVENT_TYPES.PRINTED,
        occurredAt: new Date("2026-07-14T10:05:00.000Z"),
        actor: null,
        payload: {},
        schemaVersion: 1,
      },
    ]);

    const latest = await service.getLatestEvent("org-1", "rcpt-1");
    expect(latest?.id).toBe("evt-2");
    expect(await service.getPrintCount("org-1", "rcpt-1")).toBe(1);
    expect(await service.getReprintCount("org-1", "rcpt-1")).toBe(0);
  });
});
