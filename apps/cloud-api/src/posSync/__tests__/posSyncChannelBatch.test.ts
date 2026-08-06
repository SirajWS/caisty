import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockTransaction = vi.fn();
  let txRolledBack = false;
  return { mockSelect, mockInsert, mockUpdate, mockTransaction, txRolledBack: () => txRolledBack, setTxRolledBack: (v: boolean) => { txRolledBack = v; } };
});

const channelMock = vi.hoisted(() => ({
  processChannelEvent: vi.fn(),
}));

vi.mock("../../db/client.js", () => ({
  db: {
    select: mocks.mockSelect,
    insert: mocks.mockInsert,
    update: mocks.mockUpdate,
    transaction: mocks.mockTransaction,
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
  receiptEventService: { findReceiptByLocalId: vi.fn(), appendEvent: vi.fn() },
}));

vi.mock("../../lib/shiftService.js", () => ({
  shiftService: { upsertShiftSnapshot: vi.fn() },
}));

vi.mock("../channelSyncService.js", () => ({
  channelSyncService: channelMock,
}));

import { PosSyncService } from "../PosSyncService.js";

const ORG_A = "11111111-1111-1111-1111-111111111111";
const ORG_B = "22222222-2222-2222-2222-222222222222";

const authOrgA = {
  orgId: ORG_A,
  customerId: "22222222-2222-2222-2222-222222222222",
  deviceId: "33333333-3333-3333-3333-333333333333",
  licenseId: "lic-1",
};

const authOrgB = {
  ...authOrgA,
  orgId: ORG_B,
  deviceId: "44444444-4444-4444-4444-444444444444",
};

const channelEvent = {
  eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  type: "channel" as const,
  payload: {
    op: "upsert" as const,
    channelId: "00000000-0000-0000-0000-000000000050",
    clientUpdatedAt: "2026-03-01T12:00:00.000Z",
    name: "Thunder",
    slug: "thunder",
  },
};

const deleteChannelEvent = {
  eventId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  type: "channel" as const,
  payload: {
    op: "delete" as const,
    channelId: "00000000-0000-0000-0000-000000000050",
    clientUpdatedAt: "2026-03-01T12:00:00.000Z",
  },
};

function chainSelect(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
}

function chainInsertBatch() {
  const returning = vi.fn().mockResolvedValue([
    { id: "batch-internal-id", acceptedCount: 0, duplicateCount: 0, failedCount: 0 },
  ]);
  const values = vi.fn().mockReturnValue({ returning });
  mocks.mockInsert.mockReturnValueOnce({ values });
}

function chainInsertEvent(rejectWith?: unknown) {
  const values = vi.fn().mockImplementation(() => {
    if (rejectWith) {
      return Promise.reject(rejectWith);
    }
    return Promise.resolve(undefined);
  });
  mocks.mockInsert.mockReturnValueOnce({ values });
  return values;
}

function chainUpdate() {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };
  mocks.mockUpdate.mockReturnValue(chain);
  return chain;
}

function setupTransaction() {
  mocks.mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
    mocks.setTxRolledBack(false);
    try {
      return await fn({
        select: mocks.mockSelect,
        insert: mocks.mockInsert,
        update: mocks.mockUpdate,
      });
    } catch (err) {
      mocks.setTxRolledBack(true);
      throw err;
    }
  });
}

function syncEventUniqueViolation() {
  return {
    code: "23505",
    constraint: "uq_pos_sync_events_org_sync_event_id",
  };
}

function slugUniqueViolation() {
  return {
    code: "23505",
    constraint: "uq_pos_channels_org_slug_active",
  };
}

describe("PosSyncService channel batch", () => {
  const service = new PosSyncService();

  beforeEach(() => {
    vi.clearAllMocks();
    setupTransaction();
    chainUpdate();
  });

  it("returns duplicate without reprocessing channel when event already exists outside transaction", async () => {
    mocks.mockSelect
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([{ id: "existing-event" }]));
    chainInsertBatch();

    const result = await service.processBatch(
      {
        deviceId: authOrgA.deviceId,
        licenseKey: "KEY",
        batch: { batchId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" },
        events: [channelEvent],
      },
      authOrgA,
    );

    expect(channelMock.processChannelEvent).not.toHaveBeenCalled();
    expect(result.duplicate).toContain(channelEvent.eventId);
  });

  it("registers channel event inside a transaction using the same tx handle", async () => {
    mocks.mockSelect
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]));
    chainInsertBatch();
    chainInsertEvent();
    channelMock.processChannelEvent.mockResolvedValue({ status: "accepted" });

    const result = await service.processBatch(
      {
        deviceId: authOrgA.deviceId,
        licenseKey: "KEY",
        batch: { batchId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" },
        events: [channelEvent],
      },
      authOrgA,
    );

    expect(mocks.mockTransaction).toHaveBeenCalled();
    expect(channelMock.processChannelEvent).toHaveBeenCalledWith(
      channelEvent.payload,
      authOrgA,
      "batch-internal-id",
      expect.objectContaining({ select: mocks.mockSelect, insert: mocks.mockInsert }),
    );
    expect(result.accepted).toContain(channelEvent.eventId);
  });

  it("detects duplicate inside the transaction before channel processing", async () => {
    mocks.mockSelect
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([{ id: "existing-in-tx" }]));
    chainInsertBatch();
    channelMock.processChannelEvent.mockResolvedValue({ status: "accepted" });

    const result = await service.processBatch(
      {
        deviceId: authOrgA.deviceId,
        licenseKey: "KEY",
        batch: { batchId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" },
        events: [channelEvent],
      },
      authOrgA,
    );

    expect(channelMock.processChannelEvent).not.toHaveBeenCalled();
    expect(result.duplicate).toContain(channelEvent.eventId);
  });

  it("rolls back channel upsert when event insert hits sync-event unique violation", async () => {
    mocks.mockSelect
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]));
    chainInsertBatch();
    chainInsertEvent(syncEventUniqueViolation());
    channelMock.processChannelEvent.mockResolvedValue({ status: "accepted" });

    const result = await service.processBatch(
      {
        deviceId: authOrgA.deviceId,
        licenseKey: "KEY",
        batch: { batchId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" },
        events: [channelEvent],
      },
      authOrgA,
    );

    expect(mocks.txRolledBack()).toBe(true);
    expect(channelMock.processChannelEvent).toHaveBeenCalled();
    expect(result.duplicate).toContain(channelEvent.eventId);
    expect(result.accepted).not.toContain(channelEvent.eventId);
  });

  it("rolls back channel delete when event insert hits sync-event unique violation", async () => {
    mocks.mockSelect
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]));
    chainInsertBatch();
    chainInsertEvent(syncEventUniqueViolation());
    channelMock.processChannelEvent.mockResolvedValue({ status: "accepted" });

    const result = await service.processBatch(
      {
        deviceId: authOrgA.deviceId,
        licenseKey: "KEY",
        batch: { batchId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" },
        events: [deleteChannelEvent],
      },
      authOrgA,
    );

    expect(mocks.txRolledBack()).toBe(true);
    expect(channelMock.processChannelEvent).toHaveBeenCalled();
    expect(result.duplicate).toContain(deleteChannelEvent.eventId);
  });

  it("does not treat slug unique violations as event duplicate", async () => {
    mocks.mockSelect
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]));
    chainInsertBatch();
    chainInsertEvent(slugUniqueViolation());
    channelMock.processChannelEvent.mockResolvedValue({ status: "accepted" });

    const result = await service.processBatch(
      {
        deviceId: authOrgA.deviceId,
        licenseKey: "KEY",
        batch: { batchId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" },
        events: [channelEvent],
      },
      authOrgA,
    );

    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]?.code).toBe("server_error");
    expect(result.duplicate).not.toContain(channelEvent.eventId);
  });

  it("allows retry after duplicate rollback without accepting twice", async () => {
    mocks.mockSelect
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([{ id: "now-recorded" }]));
    chainInsertBatch();
    chainInsertEvent(syncEventUniqueViolation());
    channelMock.processChannelEvent.mockResolvedValue({ status: "accepted" });

    const first = await service.processBatch(
      {
        deviceId: authOrgA.deviceId,
        licenseKey: "KEY",
        batch: { batchId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" },
        events: [channelEvent],
      },
      authOrgA,
    );

    expect(first.duplicate).toContain(channelEvent.eventId);

    chainInsertBatch();
    const second = await service.processBatch(
      {
        deviceId: authOrgA.deviceId,
        licenseKey: "KEY",
        batch: { batchId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" },
        events: [channelEvent],
      },
      authOrgA,
    );

    expect(second.duplicate).toContain(channelEvent.eventId);
    expect(second.accepted).not.toContain(channelEvent.eventId);
    expect(channelMock.processChannelEvent).toHaveBeenCalledTimes(1);
  });

  it("keeps same eventId independent across organizations", async () => {
    mocks.mockSelect
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]));
    chainInsertBatch();
    chainInsertEvent();
    channelMock.processChannelEvent.mockResolvedValue({ status: "accepted" });

    const orgAResult = await service.processBatch(
      {
        deviceId: authOrgA.deviceId,
        licenseKey: "KEY-A",
        batch: { batchId: "ffffffff-ffff-4fff-8fff-ffffffffffff" },
        events: [channelEvent],
      },
      authOrgA,
    );

    mocks.mockSelect
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]));
    chainInsertBatch();
    chainInsertEvent();
    channelMock.processChannelEvent.mockResolvedValue({ status: "accepted" });

    const orgBResult = await service.processBatch(
      {
        deviceId: authOrgB.deviceId,
        licenseKey: "KEY-B",
        batch: { batchId: "10101010-1010-4101-8101-010101010101" },
        events: [channelEvent],
      },
      authOrgB,
    );

    expect(orgAResult.accepted).toContain(channelEvent.eventId);
    expect(orgBResult.accepted).toContain(channelEvent.eventId);
    expect(channelMock.processChannelEvent).toHaveBeenCalledTimes(2);
    expect(channelMock.processChannelEvent.mock.calls[0]?.[1]?.orgId).toBe(ORG_A);
    expect(channelMock.processChannelEvent.mock.calls[1]?.[1]?.orgId).toBe(ORG_B);
  });

  it("isolates failed channel events in batch results", async () => {
    const goodEvent = {
      ...channelEvent,
      eventId: "cccccccc-cccc-4ccc-8ccc-cccccccccc01",
    };
    const badEvent = {
      ...channelEvent,
      eventId: "cccccccc-cccc-4ccc-8ccc-cccccccccc02",
    };

    mocks.mockSelect
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]));
    chainInsertBatch();
    chainInsertEvent();
    chainInsertEvent();
    channelMock.processChannelEvent
      .mockResolvedValueOnce({ status: "accepted" })
      .mockResolvedValueOnce({
        status: "failed",
        code: "secret_field_rejected",
        error: "blocked",
      });

    const result = await service.processBatch(
      {
        deviceId: authOrgA.deviceId,
        licenseKey: "KEY",
        batch: { batchId: "12121212-1212-4121-8121-212121212121" },
        events: [goodEvent, badEvent],
      },
      authOrgA,
    );

    expect(result.accepted).toContain(goodEvent.eventId);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]?.eventId).toBe(badEvent.eventId);
  });

  it("does not confirm slug conflict from channel service as duplicate", async () => {
    mocks.mockSelect
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]));
    chainInsertBatch();
    chainInsertEvent();
    channelMock.processChannelEvent.mockResolvedValue({
      status: "failed",
      code: "channel_slug_conflict",
      error: "Slug conflict",
    });

    const result = await service.processBatch(
      {
        deviceId: authOrgA.deviceId,
        licenseKey: "KEY",
        batch: { batchId: "13131313-1313-4131-8131-313131313131" },
        events: [channelEvent],
      },
      authOrgA,
    );

    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]?.code).toBe("channel_slug_conflict");
    expect(result.duplicate).not.toContain(channelEvent.eventId);
  });
});
