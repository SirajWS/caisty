import { describe, expect, it } from "vitest";

import {
  buildProviderOrderDedupKey,
  compareProviderOrderWinner,
  dedupeProviderOrders,
  type ProviderOrderDedupFields,
} from "../dedupeProviderOrders.js";
import { getOrderStatusRank } from "../../posSync/orderStatusMerge.js";

function row(
  overrides: Partial<ProviderOrderDedupFields> & { id: string },
): ProviderOrderDedupFields {
  return {
    platform: "lieferando",
    providerOrderId: "PO-1",
    localOrderId: "LOCAL-1",
    status: "accepted",
    updatedAt: "2026-07-25T10:00:00.000Z",
    soldAt: "2026-07-25T09:00:00.000Z",
    ...overrides,
  };
}

describe("buildProviderOrderDedupKey", () => {
  it("A: prefers normalize(platform)|providerOrderId", () => {
    expect(buildProviderOrderDedupKey("Lieferando", "  ABC  ", "LOCAL")).toBe(
      "lieferando|ABC",
    );
  });

  it("B: falls back to platform|local:localOrderId when providerOrderId empty", () => {
    expect(
      buildProviderOrderDedupKey("Fake_Delivery", null, "  T1785113113966  "),
    ).toBe("fake_delivery|local:T1785113113966");
    expect(buildProviderOrderDedupKey("website", "  ", "ORD-1")).toBe(
      "website|local:ORD-1",
    );
  });

  it("F: returns null when neither providerOrderId nor localOrderId", () => {
    expect(buildProviderOrderDedupKey("website", null, null)).toBeNull();
    expect(buildProviderOrderDedupKey("website", "", "  ")).toBeNull();
  });

  it("E: never builds a key for local POS platforms", () => {
    expect(buildProviderOrderDedupKey("pos", null, "SAME")).toBeNull();
    expect(buildProviderOrderDedupKey("counter", "PO-1", "SAME")).toBeNull();
    expect(buildProviderOrderDedupKey("", null, "SAME")).toBeNull();
  });

  it("H: trims/normalizes platform and ids", () => {
    expect(
      buildProviderOrderDedupKey("  Uber_Eats ", "  X  ", "ignored"),
    ).toBe("uber_eats|X");
  });
});

describe("getOrderStatusRank (delivered vs completed)", () => {
  it("keeps terminals highest", () => {
    expect(getOrderStatusRank("cancelled")).toBe(1000);
    expect(getOrderStatusRank("refunded")).toBe(1000);
  });

  it("ranks delivered above completed and ready", () => {
    expect(getOrderStatusRank("delivered")).toBeGreaterThan(
      getOrderStatusRank("completed"),
    );
    expect(getOrderStatusRank("completed")).toBeGreaterThan(
      getOrderStatusRank("ready"),
    );
    expect(getOrderStatusRank("ready")).toBeGreaterThan(
      getOrderStatusRank("accepted"),
    );
    expect(getOrderStatusRank("accepted")).toBeGreaterThan(
      getOrderStatusRank("created"),
    );
  });
});

describe("dedupeProviderOrders", () => {
  it("A: keeps one winner for same providerOrderId + platform from two devices", () => {
    const winners = dedupeProviderOrders([
      row({
        id: "desktop",
        status: "accepted",
        updatedAt: "2026-07-25T10:00:00.000Z",
      }),
      row({
        id: "web",
        status: "ready",
        updatedAt: "2026-07-25T10:05:00.000Z",
      }),
    ]);
    expect(winners).toHaveLength(1);
    expect(winners[0]?.id).toBe("web");
  });

  it("B: dedupes provider rows with empty providerOrderId via localOrderId", () => {
    const winners = dedupeProviderOrders([
      row({
        id: "d1",
        platform: "fake_delivery",
        providerOrderId: null,
        localOrderId: "T1785113113966",
        status: "created",
      }),
      row({
        id: "d2",
        platform: "fake_delivery",
        providerOrderId: "",
        localOrderId: "T1785113113966",
        status: "delivered",
      }),
    ]);
    expect(winners).toHaveLength(1);
    expect(winners[0]?.id).toBe("d2");
    expect(winners[0]?.status).toBe("delivered");
  });

  it("C: delivered beats completed on localOrderId fallback", () => {
    const winners = dedupeProviderOrders([
      row({
        id: "done",
        platform: "fake_delivery",
        providerOrderId: null,
        localOrderId: "T1",
        status: "completed",
        updatedAt: "2026-07-25T12:00:00.000Z",
      }),
      row({
        id: "del",
        platform: "fake_delivery",
        providerOrderId: null,
        localOrderId: "T1",
        status: "delivered",
        updatedAt: "2026-07-25T09:00:00.000Z",
      }),
    ]);
    expect(winners[0]?.id).toBe("del");
  });

  it("D: different platforms with same localOrderId stay separate", () => {
    const winners = dedupeProviderOrders([
      row({
        id: "l1",
        platform: "lieferando",
        providerOrderId: null,
        localOrderId: "SAME",
      }),
      row({
        id: "u1",
        platform: "uber_eats",
        providerOrderId: null,
        localOrderId: "SAME",
      }),
    ]);
    expect(winners.map((w) => w.id).sort()).toEqual(["l1", "u1"]);
  });

  it("E: local POS rows stay separate even with same localOrderId", () => {
    const winners = dedupeProviderOrders([
      row({
        id: "p1",
        platform: "pos",
        providerOrderId: null,
        localOrderId: "POS-1",
      }),
      row({
        id: "p2",
        platform: "counter",
        providerOrderId: null,
        localOrderId: "POS-1",
      }),
    ]);
    expect(winners).toHaveLength(2);
  });

  it("F: neither providerOrderId nor localOrderId → separate", () => {
    const winners = dedupeProviderOrders([
      row({
        id: "a",
        platform: "website",
        providerOrderId: null,
        localOrderId: null,
      }),
      row({
        id: "b",
        platform: "website",
        providerOrderId: "",
        localOrderId: "  ",
      }),
    ]);
    expect(winners).toHaveLength(2);
  });

  it("G: providerOrderId wins — same localOrderId different provider ids stay separate", () => {
    const winners = dedupeProviderOrders([
      row({
        id: "a",
        providerOrderId: "PO-A",
        localOrderId: "SAME-LOCAL",
      }),
      row({
        id: "b",
        providerOrderId: "PO-B",
        localOrderId: "SAME-LOCAL",
      }),
    ]);
    expect(winners).toHaveLength(2);
  });

  it("regression T1785113113966: one online order, delivered winner, revenue once", () => {
    const rows = [
      row({
        id: "70cabe39",
        platform: "fake_delivery",
        providerOrderId: null,
        localOrderId: "T1785113113966",
        status: "created",
        updatedAt: "2026-07-27T00:45:15.255Z",
        soldAt: "2026-07-27T00:45:13.967Z",
      }),
      row({
        id: "d70fec56",
        platform: "fake_delivery",
        providerOrderId: null,
        localOrderId: "T1785113113966",
        status: "delivered",
        updatedAt: "2026-07-27T00:45:27.847Z",
        soldAt: "2026-07-27T00:45:13.967Z",
      }),
    ];
    const winners = dedupeProviderOrders(rows);
    const revenueById: Record<string, number> = {
      "70cabe39": 27500,
      d70fec56: 27500,
    };
    const onlineRevenue = winners.reduce(
      (sum, w) => sum + (revenueById[w.id] ?? 0),
      0,
    );
    expect(winners).toHaveLength(1);
    expect(winners[0]?.status).toBe("delivered");
    expect(winners[0]?.id).toBe("d70fec56");
    expect(onlineRevenue).toBe(27500);
  });

  it("uses newer updatedAt when status rank ties", () => {
    const winners = dedupeProviderOrders([
      row({ id: "old", status: "ready", updatedAt: "2026-07-25T10:00:00.000Z" }),
      row({ id: "new", status: "ready", updatedAt: "2026-07-25T11:00:00.000Z" }),
    ]);
    expect(winners[0]?.id).toBe("new");
  });

  it("does not let accepted displace cancelled or delivered", () => {
    expect(
      dedupeProviderOrders([
        row({
          id: "term",
          status: "cancelled",
          updatedAt: "2026-07-25T08:00:00.000Z",
        }),
        row({
          id: "active",
          status: "accepted",
          updatedAt: "2026-07-25T12:00:00.000Z",
        }),
      ])[0]?.id,
    ).toBe("term");

    expect(
      dedupeProviderOrders([
        row({
          id: "del",
          status: "delivered",
          updatedAt: "2026-07-25T08:00:00.000Z",
        }),
        row({
          id: "acc",
          status: "accepted",
          updatedAt: "2026-07-25T12:00:00.000Z",
        }),
      ])[0]?.id,
    ).toBe("del");
  });
});

describe("compareProviderOrderWinner", () => {
  it("breaks remaining ties with stable id order", () => {
    const a = row({
      id: "aaa",
      status: "ready",
      updatedAt: "2026-07-25T10:00:00.000Z",
      soldAt: "2026-07-25T09:00:00.000Z",
    });
    const b = row({
      id: "bbb",
      status: "ready",
      updatedAt: "2026-07-25T10:00:00.000Z",
      soldAt: "2026-07-25T09:00:00.000Z",
    });
    expect(compareProviderOrderWinner(a, b)).toBeGreaterThan(0);
  });
});
