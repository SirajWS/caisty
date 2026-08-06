import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("../../db/client.js", () => ({
  db: {
    select: mocks.mockSelect,
    insert: mocks.mockInsert,
    update: mocks.mockUpdate,
  },
}));

import { ChannelSyncService } from "../channelSyncService.js";

const auth = {
  orgId: "11111111-1111-1111-1111-111111111111",
  customerId: "22222222-2222-2222-2222-222222222222",
  deviceId: "33333333-3333-3333-3333-333333333333",
  licenseId: "lic-1",
};

const channelId = "00000000-0000-0000-0000-000000000050";

function chainSelect(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
}

function chainInsert() {
  const values = vi.fn().mockResolvedValue(undefined);
  mocks.mockInsert.mockReturnValue({ values });
  return { values };
}

function chainUpdate() {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };
  mocks.mockUpdate.mockReturnValue(chain);
  return chain;
}

describe("ChannelSyncService LWW and tombstones", () => {
  const service = new ChannelSyncService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts under auth org", async () => {
    mocks.mockSelect
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(chainSelect([]));
    chainInsert();

    const result = await service.processChannelEvent(
      {
        op: "upsert",
        channelId,
        clientUpdatedAt: "2026-03-01T12:00:00.000Z",
        name: "Thunder",
        slug: "thunder",
      },
      auth,
      "batch-1",
    );

    expect(result.status).toBe("accepted");
  });

  it("returns duplicate for stale upsert", async () => {
    mocks.mockSelect.mockReturnValueOnce(
      chainSelect([
      {
        id: channelId,
        orgId: auth.orgId,
        clientUpdatedAt: new Date("2026-03-02T00:00:00.000Z"),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        deletedAt: null,
      },
    ]),
    );

    const result = await service.processChannelEvent(
      {
        op: "upsert",
        channelId,
        clientUpdatedAt: "2026-03-01T00:00:00.000Z",
        name: "Old",
        slug: "old",
      },
      auth,
      "batch-1",
    );

    expect(result.status).toBe("duplicate");
  });

  it("returns duplicate for identical clientUpdatedAt upsert", async () => {
    mocks.mockSelect.mockReturnValueOnce(
      chainSelect([
      {
        id: channelId,
        orgId: auth.orgId,
        clientUpdatedAt: new Date("2026-03-01T12:00:00.000Z"),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        deletedAt: null,
      },
    ]),
    );

    const result = await service.processChannelEvent(
      {
        op: "upsert",
        channelId,
        clientUpdatedAt: "2026-03-01T12:00:00.000Z",
        name: "Same",
        slug: "same",
      },
      auth,
      "batch-1",
    );

    expect(result.status).toBe("duplicate");
  });

  it("reactivates channel after newer upsert following tombstone", async () => {
    mocks.mockSelect
      .mockReturnValueOnce(chainSelect([
        {
          id: channelId,
          orgId: auth.orgId,
          clientUpdatedAt: new Date("2026-03-01T00:00:00.000Z"),
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          deletedAt: new Date("2026-03-01T00:00:00.000Z"),
        },
      ]))
      .mockReturnValueOnce(chainSelect([]));
    chainUpdate();

    const result = await service.processChannelEvent(
      {
        op: "upsert",
        channelId,
        clientUpdatedAt: "2026-03-02T00:00:00.000Z",
        name: "Back",
        slug: "back",
      },
      auth,
      "batch-1",
    );

    expect(result.status).toBe("accepted");
    expect(mocks.mockUpdate).toHaveBeenCalled();
  });

  it("rejects stale upsert on soft-deleted tombstone", async () => {
    mocks.mockSelect.mockReturnValueOnce(
      chainSelect([
        {
          id: channelId,
          orgId: auth.orgId,
          clientUpdatedAt: new Date("2026-03-02T00:00:00.000Z"),
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          deletedAt: new Date("2026-03-02T00:00:00.000Z"),
        },
      ]),
    );

    const result = await service.processChannelEvent(
      {
        op: "upsert",
        channelId,
        clientUpdatedAt: "2026-03-01T00:00:00.000Z",
        name: "Too Old",
        slug: "too-old",
      },
      auth,
      "batch-1",
    );

    expect(result.status).toBe("duplicate");
    expect(mocks.mockUpdate).not.toHaveBeenCalled();
  });

  it("allows reactivation upsert with same timestamp after tombstone", async () => {
    mocks.mockSelect
      .mockReturnValueOnce(chainSelect([
        {
          id: channelId,
          orgId: auth.orgId,
          clientUpdatedAt: new Date("2026-03-01T12:00:00.000Z"),
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          deletedAt: new Date("2026-03-01T00:00:00.000Z"),
        },
      ]))
      .mockReturnValueOnce(chainSelect([]));
    const updateChain = chainUpdate();

    const result = await service.processChannelEvent(
      {
        op: "upsert",
        channelId,
        clientUpdatedAt: "2026-03-01T12:00:00.000Z",
        name: "Back",
        slug: "back",
      },
      auth,
      "batch-1",
    );

    expect(result.status).toBe("accepted");
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ deletedAt: null }),
    );
  });

  it("rejects stale delete on active channel", async () => {
    mocks.mockSelect.mockReturnValueOnce(
      chainSelect([
      {
        id: channelId,
        orgId: auth.orgId,
        clientUpdatedAt: new Date("2026-03-02T00:00:00.000Z"),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        deletedAt: null,
      },
    ]),
    );

    const result = await service.processChannelEvent(
      {
        op: "delete",
        channelId,
        clientUpdatedAt: "2026-03-01T00:00:00.000Z",
      },
      auth,
      "batch-1",
    );

    expect(result.status).toBe("duplicate");
  });

  it("creates tombstone for unknown channel delete", async () => {
    mocks.mockSelect.mockReturnValueOnce(chainSelect([]));
    chainInsert();

    const result = await service.processChannelEvent(
      {
        op: "delete",
        channelId,
        clientUpdatedAt: "2026-03-01T12:00:00.000Z",
      },
      auth,
      "batch-1",
    );

    expect(result.status).toBe("accepted");
  });

  it("rejects slug conflict in same org", async () => {
    const chain1 = chainSelect([]);
    const chain2 = chainSelect([{ id: "other-id" }]);
    mocks.mockSelect.mockReturnValueOnce(chain1).mockReturnValueOnce(chain2);

    const result = await service.processChannelEvent(
      {
        op: "upsert",
        channelId,
        clientUpdatedAt: "2026-03-01T12:00:00.000Z",
        name: "Thunder",
        slug: "thunder",
      },
      auth,
      "batch-1",
    );

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.code).toBe("channel_slug_conflict");
    }
  });
});
