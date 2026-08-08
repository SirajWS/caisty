import { beforeEach, describe, expect, it, vi } from "vitest";

const ORG_A = "11111111-1111-1111-1111-111111111111";
const CHANNEL_ID = "00000000-0000-0000-0000-000000000050";

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
import { listPortalChannels } from "../../lib/portalChannelService.js";

const auth = {
  orgId: ORG_A,
  customerId: "22222222-2222-2222-2222-222222222222",
  deviceId: "33333333-3333-3333-3333-333333333333",
  licenseId: "lic-1",
};

function chainSelect(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
    orderBy: vi.fn().mockResolvedValue(rows),
  };
}

function chainInsert() {
  const values = vi.fn().mockResolvedValue(undefined);
  mocks.mockInsert.mockReturnValue({ values });
  return { values };
}

describe("POS channel batch upsert visibility in portal list", () => {
  const service = new ChannelSyncService();
  let storedRow: Record<string, unknown> | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    storedRow = null;
  });

  it("accepted POS upsert is returned by listPortalChannels for the same org", async () => {
    mocks.mockSelect.mockImplementation(() => {
      if (storedRow) {
        return chainSelect([storedRow]);
      }
      return chainSelect([]);
    });

    chainInsert();
    mocks.mockInsert.mockImplementation(() => ({
      values: vi.fn((values: Record<string, unknown>) => {
        storedRow = {
          ...values,
          deletedAt: null,
          createdAt: new Date("2026-08-06T00:00:00.000Z"),
          updatedAt: new Date("2026-08-06T00:00:00.000Z"),
        };
        return Promise.resolve(undefined);
      }),
    }));

    const upsert = await service.processChannelEvent(
      {
        op: "upsert",
        channelId: CHANNEL_ID,
        clientUpdatedAt: "2026-08-06T00:00:00.000Z",
        name: "Thunder POS",
        slug: "thunder",
        enabled: true,
        provider: "thunder",
      },
      auth,
      "batch-pos-1",
      {
        select: mocks.mockSelect,
        insert: mocks.mockInsert,
        update: mocks.mockUpdate,
      },
    );

    expect(upsert.status).toBe("accepted");

    const portalRows = await listPortalChannels({
      customerId: auth.customerId,
      orgId: auth.orgId,
    });
    expect(portalRows.some((row) => row.id === CHANNEL_ID && row.slug === "thunder")).toBe(true);
  });
});
