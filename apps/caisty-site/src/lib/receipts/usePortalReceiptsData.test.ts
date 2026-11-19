import { describe, expect, it } from "vitest";
import {
  beginReceiptsFetchState,
  receiptsQueryFingerprint,
  type ReceiptsQueryState,
} from "./usePortalReceiptsData";
import type { ReceiptsData } from "./types";

const customer = {
  id: "c1",
  orgId: "o1",
  name: "Alex",
  email: "alex@test.com",
  portalStatus: "active" as const,
};

const previousPage = {
  timezone: "Europe/Berlin",
  period: "today",
  summary: {
    receiptsCount: 4,
    activeCount: 4,
    printedCount: 4,
    reprintedCount: 0,
    refundsCount: 0,
    posRevenueCents: 4000,
    paymentSummary: {
      cashCents: 4000,
      cardCents: 0,
      voucherCents: 0,
      otherCents: 0,
      currency: "EUR",
    },
  },
  receipts: [],
  pagination: {
    total: 4,
    limit: 20,
    offset: 0,
    page: 1,
    totalPages: 1,
  },
};

function prevState(): ReceiptsData {
  return {
    customer,
    page: previousPage,
    detail: null,
    detailReceiptId: null,
    detailLoading: false,
    loading: false,
    error: false,
    incompatibleApi: false,
    applied: { period: "today" },
    lastSyncedAt: new Date("2026-11-15T10:00:00.000Z"),
  };
}

describe("beginReceiptsFetchState", () => {
  it("clears previous receipts when the applied period changes", () => {
    const next = beginReceiptsFetchState(prevState(), {
      applied: { period: "custom", from: "2026-11-01", to: "2026-11-15" },
      clearPage: true,
    });
    expect(next.loading).toBe(true);
    expect(next.page).toBeNull();
    expect(next.applied).toEqual({
      period: "custom",
      from: "2026-11-01",
      to: "2026-11-15",
    });
    expect(next.lastSyncedAt).toEqual(prevState().lastSyncedAt);
  });

  it("keeps the current page during a 30s refresh of the same query", () => {
    const next = beginReceiptsFetchState(prevState(), {
      applied: { period: "today" },
      clearPage: false,
    });
    expect(next.page).toEqual(previousPage);
    expect(next.loading).toBe(false);
  });
});

describe("receiptsQueryFingerprint", () => {
  it("stays stable for auto-refresh of the same custom filters", () => {
    const query: ReceiptsQueryState = {
      period: { period: "custom", from: "2026-11-01", to: "2026-11-15" },
      paymentMethod: "cash",
      status: "partial_refund",
      search: "R-100",
      sort: "newest",
      page: 2,
    };
    expect(receiptsQueryFingerprint(query, "R-100")).toBe(
      receiptsQueryFingerprint({ ...query }, "R-100"),
    );
    expect(receiptsQueryFingerprint(query, "R-100")).not.toBe(
      receiptsQueryFingerprint({ ...query, page: 1 }, "R-100"),
    );
  });
});
