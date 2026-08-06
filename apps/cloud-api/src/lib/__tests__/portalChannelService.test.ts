import { beforeEach, describe, expect, it, vi } from "vitest";

const ORG_A = "11111111-1111-1111-1111-111111111111";
const CUST_A = "22222222-2222-2222-2222-222222222222";
const CHANNEL_ID = "33333333-3333-3333-3333-333333333333";

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

import { importPortalChannelsReplace } from "../portalChannelService.js";

const actor = { customerId: CUST_A, orgId: ORG_A };

function chainSelect(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
  mocks.mockSelect.mockReturnValue(chain);
  return chain;
}

function chainUpdate() {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };
  mocks.mockUpdate.mockReturnValue(chain);
  return chain;
}

function chainInsert(returning: unknown[]) {
  const chain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(returning),
  };
  mocks.mockInsert.mockReturnValue(chain);
  return chain;
}

function insertedRow(overrides: Record<string, unknown> = {}) {
  const now = new Date("2026-08-06T00:00:00.000Z");
  return {
    id: CHANNEL_ID,
    orgId: ORG_A,
    customerId: CUST_A,
    sourceDeviceId: null,
    slug: "postman",
    name: "Fake Provider (Postman)",
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

describe("importPortalChannelsReplace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps direct POS channel through merge import without throwing", async () => {
    const capturedValues: unknown[] = [];

    mocks.mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    });

    mocks.mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([insertedRow({ id: CHANNEL_ID, slug: "postman" })]),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(undefined),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn((values: unknown) => {
            capturedValues.push(values);
            return Promise.resolve(undefined);
          }),
        }),
      };
      return fn(tx);
    });

    const result = await importPortalChannelsReplace(actor, [
      {
        id: CHANNEL_ID,
        name: "Fake Provider (Postman)",
        slug: "postman",
        provider: "other",
        providerType: "delivery_app",
        enabled: true,
      },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.channels).toHaveLength(1);
    expect(result.data.channels[0].slug).toBe("postman");
    expect(capturedValues).toHaveLength(1);
    expect(capturedValues[0]).toMatchObject({
      id: CHANNEL_ID,
      orgId: ORG_A,
      customerId: CUST_A,
      sourceDeviceId: null,
      slug: "postman",
      name: "Fake Provider (Postman)",
      enabled: true,
      provider: "other",
      deletedAt: null,
    });
  });

  it("rolls back transaction when insert fails", async () => {
    mocks.mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    });

    mocks.mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([]),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(undefined),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockRejectedValue(new Error("insert failed")),
        }),
      };
      return fn(tx);
    });

    await expect(
      importPortalChannelsReplace(actor, [
        { name: "Fake Provider", slug: "postman", provider: "other" },
      ]),
    ).rejects.toThrow("insert failed");
  });

  it("rejects duplicate slugs in one import batch before touching the database", async () => {
    const result = await importPortalChannelsReplace(actor, [
      { name: "A", slug: "postman", provider: "other" },
      { name: "B", slug: "postman", provider: "other" },
    ]);

    expect(result).toMatchObject({
      ok: false,
      code: "CHANNEL_SLUG_CONFLICT",
      index: 1,
    });
    expect(mocks.mockTransaction).not.toHaveBeenCalled();
  });
});

describe("importPortalChannelsReplace list helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds insert values with org from portal actor only", async () => {
    let insertValues: Record<string, unknown> | undefined;

    mocks.mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    });

    mocks.mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([insertedRow({ id: CHANNEL_ID, slug: "postman" })]),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(undefined),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn((values: Record<string, unknown>) => {
            insertValues = values;
            return Promise.resolve(undefined);
          }),
        }),
      };
      return fn(tx);
    });

    const result = await importPortalChannelsReplace(actor, [
      {
        id: CHANNEL_ID,
        name: "Fake Provider",
        slug: "postman",
        provider: "other",
        providerType: "delivery_app",
      },
    ]);

    expect(result.ok).toBe(true);
    expect(insertValues).toBeDefined();
    expect(insertValues!.orgId).toBe(ORG_A);
    expect(insertValues!.customerId).toBe(CUST_A);
    expect(insertValues!.sourceDeviceId).toBeNull();
    expect(insertValues!.configJson).toMatchObject({
      providerType: "delivery_app",
    });
  });
});
