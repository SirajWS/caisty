import { describe, expect, it, vi, beforeEach } from "vitest";

import { createApplyPullSnapshots } from "./applyPullSnapshots.js";
import { createPullPosSyncChanges } from "./pullClient.js";
import { createSyncState } from "./syncState.js";
import { makeMemoryStorage } from "./testHelpers.js";
import type { LocalSyncRepository } from "./applyPullSnapshots.js";

function emptyPullResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    schemaVersion: 1,
    serverTime: "2026-07-08T10:00:00.000Z",
    scope: { orgId: "org-1", deviceId: "dev-1" },
    changes: {
      orders: [],
      receipts: [],
      payments: [],
      receiptEvents: [],
      shifts: [],
    },
    nextCursors: {
      orders: null,
      receipts: null,
      payments: null,
      receiptEvents: null,
      shifts: null,
    },
    hasMore: {
      orders: false,
      receipts: false,
      payments: false,
      receiptEvents: false,
      shifts: false,
    },
    ...overrides,
  };
}

function createRepo(): LocalSyncRepository {
  const orders: Array<Record<string, unknown>> = [];
  return {
    loadOrders: () => orders,
    saveOrders: (next) => {
      orders.splice(0, orders.length, ...next);
    },
    getSales: () => [],
    upsertSales: () => {},
    listShifts: () => [],
    upsertShift: (shift) => shift,
    appendReceiptEvent: () => true,
    readOutbox: () => [],
  };
}

describe("createPullPosSyncChanges", () => {
  const storage = makeMemoryStorage();
  const syncState = createSyncState(storage);
  const postPull = vi.fn();
  const emitter = {
    emitOrdersChanged: vi.fn(),
    emitSalesChanged: vi.fn(),
    emitReceiptEventsChanged: vi.fn(),
    emitShiftsChanged: vi.fn(),
  };

  beforeEach(() => {
    storage.clear();
    postPull.mockReset();
    vi.clearAllMocks();
  });

  it("returns empty pull without advancing cursors when nothing changed", async () => {
    postPull.mockResolvedValue(emptyPullResponse());
    const scopeKey = syncState.getPullScopeKey("http://api.test", "org-1");
    const pull = createPullPosSyncChanges({
      api: { postPull },
      syncState,
      repo: createRepo(),
      emitter,
      getCredentials: () => ({
        deviceId: "dev-1",
        licenseKey: "key",
        orgId: "org-1",
      }),
      cloudBaseUrl: "http://api.test",
    });

    const result = await pull();
    expect(result.ok).toBe(true);
    expect(result.reason).toBe("empty_pull");
    expect(syncState.getPullCursors(scopeKey)).toEqual({
      orders: null,
      receipts: null,
      payments: null,
      receiptEvents: null,
      shifts: null,
    });
  });

  it("paginates while any entity hasMore", async () => {
    postPull
      .mockResolvedValueOnce(
        emptyPullResponse({
          nextCursors: {
            orders: "cur-1",
            receipts: null,
            payments: null,
            receiptEvents: null,
            shifts: null,
          },
          hasMore: {
            orders: true,
            receipts: false,
            payments: false,
            receiptEvents: false,
            shifts: false,
          },
        }),
      )
      .mockResolvedValueOnce(emptyPullResponse());

    const pull = createPullPosSyncChanges({
      api: { postPull },
      syncState,
      repo: createRepo(),
      emitter,
      getCredentials: () => ({
        deviceId: "dev-1",
        licenseKey: "key",
        orgId: "org-1",
      }),
      cloudBaseUrl: "http://api.test",
    });

    const result = await pull();
    expect(result.ok).toBe(true);
    expect(result.pages).toBe(2);
    expect(postPull).toHaveBeenCalledTimes(2);
  });

  it("prevents parallel pulls via cycle lock in runSyncCycle not pull client", async () => {
    postPull.mockResolvedValue(emptyPullResponse());
    const pull = createPullPosSyncChanges({
      api: { postPull },
      syncState,
      repo: createRepo(),
      emitter,
      getCredentials: () => ({
        deviceId: "dev-1",
        licenseKey: "key",
        orgId: "org-1",
      }),
      cloudBaseUrl: "http://api.test",
    });

    const [a, b] = await Promise.all([pull(), pull()]);
    expect(a.ok || b.ok).toBe(true);
    expect(postPull.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("applies order changes from pull response", async () => {
    const repo = createRepo();
    postPull.mockResolvedValue(
      emptyPullResponse({
        changes: {
          orders: [
            {
              id: "cloud-1",
              localOrderId: "wolt-1",
              providerOrderId: "ext-1",
              platform: "wolt",
              sourceDeviceId: "dev-b",
              status: "accepted",
              paymentStatus: "pending",
              paymentMethod: null,
              totalCents: 1000,
              currency: "EUR",
              soldAt: "2026-07-08T10:00:00.000Z",
              createdAt: "2026-07-08T10:00:00.000Z",
              updatedAt: "2026-07-08T10:00:00.000Z",
              lines: [],
            },
          ],
          receipts: [],
          payments: [],
          receiptEvents: [],
          shifts: [],
        },
      }),
    );

    const apply = createApplyPullSnapshots(repo, emitter);
    const pull = createPullPosSyncChanges({
      api: { postPull },
      syncState,
      repo,
      emitter,
      getCredentials: () => ({
        deviceId: "dev-1",
        licenseKey: "key",
        orgId: "org-1",
      }),
      cloudBaseUrl: "http://api.test",
    });

    const result = await pull();
    expect(result.ok).toBe(true);
    expect(repo.loadOrders()).toHaveLength(1);
    expect(apply).toBeDefined();
  });
});
