import { beforeEach, describe, expect, it, vi } from "vitest";

const eqCalls: Array<{ column: unknown; value: unknown }> = [];

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: (column: unknown, value: unknown) => {
      eqCalls.push({ column, value });
      return actual.eq(column as never, value as never);
    },
  };
});

const mocks = vi.hoisted(() => ({
  mockSelect: vi.fn(),
}));

vi.mock("../../db/client.js", () => ({
  db: { select: mocks.mockSelect },
}));

import { encodeChannelPullCursor } from "../channelPullCursor.js";
import { PullCursorOrgMismatchError } from "../pullErrors.js";
import { InvalidPullCursorError } from "../pullErrors.js";
import { PosPullService } from "../PosPullService.js";
import { posChannels } from "../../db/schema/posChannels.js";

const ORG_A = "11111111-1111-1111-1111-111111111111";
const ORG_B = "99999999-9999-9999-9999-999999999999";

function makeChannelRow(id: string, updatedAt: string, deleted = false) {
  const ts = new Date(updatedAt);
  return {
    id,
    orgId: ORG_A,
    slug: id.slice(0, 8),
    name: id,
    enabled: !deleted,
    provider: null,
    mode: null,
    storeId: null,
    statusMapping: {},
    notes: null,
    logoDataUrl: null,
    configJson: {},
    deletedAt: deleted ? ts : null,
    sourceDeviceId: "dev",
    clientUpdatedAt: ts,
    createdAt: ts,
    updatedAt: ts,
  };
}

function mockChannelRows(rows: ReturnType<typeof makeChannelRow>[]) {
  mocks.mockSelect.mockReturnValue({
    from: () => ({
      where: () => ({
        orderBy: () => ({
          limit: () => Promise.resolve(rows),
        }),
      }),
    }),
  });
}

type ServiceWithChannels = PosPullService & {
  pullChannels: (
    orgId: string,
    cursor: string | null,
    limit: number,
  ) => Promise<{
    items: Array<{ id: string; deleted: boolean }>;
    hasMore: boolean;
    nextCursor: string | null;
  }>;
  buildChannelCursorFilter: (
    orgId: string,
    encodedCursor: string | null,
    timestampColumn: unknown,
    idColumn: unknown,
  ) => unknown;
};

describe("PosPullService channels", () => {
  const service = new PosPullService() as ServiceWithChannels;

  beforeEach(() => {
    vi.clearAllMocks();
    eqCalls.length = 0;
  });

  it("pullChannels returns org-scoped snapshots and tombstones", async () => {
    mockChannelRows([
      makeChannelRow("00000000-0000-0000-0000-000000000001", "2026-07-27T10:00:00.000Z"),
      makeChannelRow(
        "00000000-0000-0000-0000-000000000002",
        "2026-07-27T10:00:00.000Z",
        true,
      ),
    ]);

    const page = await service.pullChannels(ORG_A, null, 50);
    expect(page.items.map((item) => item.id)).toHaveLength(2);
    expect(page.items[1]?.deleted).toBe(true);
    expect(eqCalls.some((c) => c.column === posChannels.orgId && c.value === ORG_A)).toBe(
      true,
    );
  });

  it("maps portal channels with null sourceDeviceId", async () => {
    mockChannelRows([
      {
        ...makeChannelRow("00000000-0000-0000-0000-000000000001", "2026-07-27T10:00:00.000Z"),
        sourceDeviceId: null,
      },
    ]);

    const page = await service.pullChannels(ORG_A, null, 50);
    expect(page.items[0]?.sourceDeviceId).toBeNull();
  });

  it("maps POS channels with device UUID sourceDeviceId", async () => {
    const deviceId = "00000000-0000-0000-0000-000000000099";
    mockChannelRows([
      {
        ...makeChannelRow("00000000-0000-0000-0000-000000000001", "2026-07-27T10:00:00.000Z"),
        sourceDeviceId: deviceId,
      },
    ]);

    const page = await service.pullChannels(ORG_A, null, 50);
    expect(page.items[0]?.sourceDeviceId).toBe(deviceId);
  });

  it("returns portal channel snapshots with sourceDeviceId null", async () => {
    const ts = new Date("2026-07-27T10:00:00.000Z");
    mockChannelRows([
      {
        ...makeChannelRow("00000000-0000-0000-0000-000000000003", "2026-07-27T10:00:00.000Z"),
        sourceDeviceId: null,
      },
    ]);

    const page = await service.pullChannels(ORG_A, null, 50);
    expect(page.items[0]?.sourceDeviceId).toBeNull();
    expect(page.items[0]?.id).toBe("00000000-0000-0000-0000-000000000003");
  });

  it("returns empty channel pull page", async () => {
    const rows = [
      makeChannelRow("00000000-0000-0000-0000-000000000001", "2026-07-27T10:00:00.000Z"),
      makeChannelRow("00000000-0000-0000-0000-000000000002", "2026-07-27T10:00:00.000Z"),
      makeChannelRow("00000000-0000-0000-0000-000000000003", "2026-07-27T10:00:01.000Z"),
      makeChannelRow("00000000-0000-0000-0000-000000000004", "2026-07-27T10:00:02.000Z"),
      makeChannelRow("00000000-0000-0000-0000-000000000005", "2026-07-27T10:00:02.000Z"),
    ];

    const limit = 2;
    const collected: string[] = [];
    let cursor: string | null = null;
    let pages = 0;

    while (pages < 4) {
      const sliceStart = cursor
        ? rows.findIndex((row) => {
            const decoded = JSON.parse(
              Buffer.from(cursor!, "base64url").toString("utf8"),
            ) as { ts: string; id: string };
            const ts = decoded.ts;
            const id = decoded.id;
            const rowTs = row.updatedAt.toISOString();
            return (
              rowTs > ts ||
              (rowTs === ts && row.id > id)
            );
          })
        : 0;

      const pageRows = rows.slice(sliceStart, sliceStart + limit + 1);
      mockChannelRows(pageRows);

      const page = await service.pullChannels(ORG_A, cursor, limit);
      collected.push(...page.items.map((item) => item.id));
      pages += 1;

      if (!page.hasMore) {
        expect(page.nextCursor).toBeNull();
        break;
      }
      expect(page.nextCursor).toBeTruthy();
      cursor = page.nextCursor;
    }

    expect(pages).toBe(3);
    expect(collected).toEqual(rows.map((row) => row.id));
    expect(new Set(collected).size).toBe(rows.length);
  });

  it("orders channels with identical updated_at deterministically by id", async () => {
    mocks.mockSelect
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            orderBy: () => ({
              limit: () =>
                Promise.resolve([
                  makeChannelRow(
                    "00000000-0000-0000-0000-000000000002",
                    "2026-07-27T10:00:00.000Z",
                  ),
                  makeChannelRow(
                    "00000000-0000-0000-0000-000000000003",
                    "2026-07-27T10:00:00.000Z",
                  ),
                ]),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            orderBy: () => ({
              limit: () =>
                Promise.resolve([
                  makeChannelRow(
                    "00000000-0000-0000-0000-000000000003",
                    "2026-07-27T10:00:00.000Z",
                  ),
                ]),
            }),
          }),
        }),
      });

    const page = await service.pullChannels(ORG_A, null, 1);
    expect(page.items[0]?.id).toBe("00000000-0000-0000-0000-000000000002");
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBeTruthy();

    const nextPage = await service.pullChannels(ORG_A, page.nextCursor, 1);
    expect(nextPage.items[0]?.id).toBe("00000000-0000-0000-0000-000000000003");
  });

  it("buildChannelCursorFilter rejects foreign-org cursor", () => {
    const foreignCursor = encodeChannelPullCursor({
      orgId: ORG_B,
      timestamp: "2026-07-27T10:00:00.000Z",
      id: "00000000-0000-0000-0000-000000000099",
    });

    expect(() =>
      service.buildChannelCursorFilter(
        ORG_A,
        foreignCursor,
        posChannels.updatedAt,
        posChannels.id,
      ),
    ).toThrow(PullCursorOrgMismatchError);
  });

  it("buildChannelCursorFilter rejects legacy v1 cursor", () => {
    const v1 = Buffer.from(
      JSON.stringify({
        v: 1,
        ts: "2026-07-27T10:00:00.000Z",
        id: "00000000-0000-0000-0000-000000000001",
      }),
      "utf8",
    ).toString("base64url");

    expect(() =>
      service.buildChannelCursorFilter(ORG_A, v1, posChannels.updatedAt, posChannels.id),
    ).toThrow(InvalidPullCursorError);
  });
});
