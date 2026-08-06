import { beforeEach, describe, expect, it, vi } from "vitest";

const ORG_A = "11111111-1111-1111-1111-111111111111";
const CUST_A = "22222222-2222-2222-2222-222222222222";
const EXISTING_ID = "33333333-3333-3333-3333-333333333333";
const NEW_ID = "44444444-4444-4444-4444-444444444444";

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockInsert = vi.fn();
  const mockTransaction = vi.fn();
  return { mockSelect, mockUpdate, mockInsert, mockTransaction };
});

vi.mock("../../db/client.js", () => ({
  db: {
    select: mocks.mockSelect,
    update: mocks.mockUpdate,
    insert: mocks.mockInsert,
    transaction: mocks.mockTransaction,
  },
}));

import {
  importPortalChannelsMerge,
  listPortalChannels,
} from "../portalChannelService.js";

const actor = { customerId: CUST_A, orgId: ORG_A };

function insertedRow(overrides: Record<string, unknown> = {}) {
  const now = new Date("2026-08-06T00:00:00.000Z");
  return {
    id: EXISTING_ID,
    orgId: ORG_A,
    customerId: CUST_A,
    sourceDeviceId: null,
    slug: "existing",
    name: "Existing",
    enabled: true,
    provider: "other",
    mode: null,
    storeId: null,
    statusMapping: {},
    notes: null,
    logoDataUrl: null,
    configJson: { providerType: "delivery_app" },
    deletedAt: null,
    clientUpdatedAt: now,
    syncBatchId: null,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("importPortalChannelsMerge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds new channels without soft-deleting existing rows", async () => {
    const existing = insertedRow();
    let updateCalls = 0;

    mocks.mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([existing]),
    });

    mocks.mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([
            existing,
            insertedRow({ id: NEW_ID, slug: "new-one", name: "New One" }),
          ]),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockImplementation(async () => {
            updateCalls += 1;
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };
      return fn(tx);
    });

    const result = await importPortalChannelsMerge(actor, [
      { id: NEW_ID, name: "New One", slug: "new-one", provider: "other", enabled: true },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.added).toBe(1);
    expect(result.data.keptExisting).toBe(1);
    expect(updateCalls).toBe(0);
  });

  it("updates existing id in place", async () => {
    const existing = insertedRow();
    let updatedName: string | undefined;

    mocks.mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([existing]),
    });

    mocks.mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([
            insertedRow({ name: "Updated Name" }),
          ]),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockImplementation((values: { name?: string }) => {
            updatedName = values.name;
            return {
              where: vi.fn().mockResolvedValue(undefined),
            };
          }),
        }),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
      };
      return fn(tx);
    });

    const result = await importPortalChannelsMerge(actor, [
      {
        id: EXISTING_ID,
        name: "Updated Name",
        slug: "existing",
        provider: "other",
        enabled: true,
      },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.updated).toBe(1);
    expect(updatedName).toBe("Updated Name");
  });

  it("returns 409-style failure for slug conflict without transaction", async () => {
    mocks.mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([insertedRow()]),
    });

    const result = await importPortalChannelsMerge(actor, [
      {
        id: NEW_ID,
        name: "Conflict",
        slug: "existing",
        provider: "other",
        enabled: true,
      },
    ]);

    expect(result).toMatchObject({ ok: false, code: "CHANNEL_SLUG_CONFLICT" });
    expect(mocks.mockTransaction).not.toHaveBeenCalled();
  });

  it("listPortalChannels scopes to actor org only", async () => {
    mocks.mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([insertedRow()]),
    });

    const rows = await listPortalChannels(actor);
    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe("existing");
  });

  it("reactivates soft-deleted channel on merge import of same id", async () => {
    const deleted = insertedRow({
      deletedAt: new Date("2026-08-06T12:00:00.000Z"),
      enabled: false,
    });
    let reactivatedDeletedAt: Date | null | undefined = undefined;

    mocks.mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([deleted]),
    });

    mocks.mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([insertedRow({ deletedAt: null, name: "Existing" })]),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockImplementation((values: { deletedAt?: Date | null }) => {
            reactivatedDeletedAt = values.deletedAt ?? null;
            return {
              where: vi.fn().mockResolvedValue(undefined),
            };
          }),
        }),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
      };
      return fn(tx);
    });

    const result = await importPortalChannelsMerge(actor, [
      {
        id: EXISTING_ID,
        name: "Existing",
        slug: "existing",
        provider: "other",
        enabled: true,
      },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.updated).toBe(1);
    expect(reactivatedDeletedAt).toBeNull();
    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });

  it("listPortalChannels excludes deleted rows before reimport and includes after", async () => {
    const active = insertedRow();
    mocks.mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([active]),
    });

    const before = await listPortalChannels(actor);
    expect(before).toHaveLength(1);
    expect(before[0].id).toBe(EXISTING_ID);
  });
});
