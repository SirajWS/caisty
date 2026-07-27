import { describe, expect, it } from "vitest";

import {
  isProviderOrder,
  normalizeOrderSource,
  ORDER_SOURCE,
} from "../orderSource.js";
import { dedupeProviderOrders } from "../dedupeProviderOrders.js";

describe("portal orders grouping", () => {
  it("keeps POS and provider orders in separate groups", () => {
    const rows = [
      { id: "1", platform: null },
      { id: "2", platform: "pos" },
      { id: "3", platform: "fake_delivery" },
      { id: "4", platform: "website" },
    ];

    const live = rows.filter((row) => !isProviderOrder(row.platform));
    const provider = rows.filter((row) => isProviderOrder(row.platform));

    expect(live.map((row) => row.id)).toEqual(["1", "2"]);
    expect(provider.map((row) => row.id)).toEqual(["3", "4"]);
    expect(live.some((row) => provider.some((p) => p.id === row.id))).toBe(
      false,
    );
  });

  it("preserves delivered and cancelled provider statuses distinctly", () => {
    expect(normalizeOrderSource("fake_delivery")).toBe(ORDER_SOURCE.DELIVERY);
    expect(normalizeOrderSource("website")).toBe(ORDER_SOURCE.ONLINE);
  });

  it("dedupes provider orders from two devices before portal lists", () => {
    const providerRows = [
      {
        id: "desktop",
        platform: "lieferando",
        providerOrderId: "PO-9",
        localOrderId: "L-9",
        status: "accepted",
        updatedAt: "2026-07-25T10:00:00.000Z",
        soldAt: "2026-07-25T09:00:00.000Z",
      },
      {
        id: "web",
        platform: "lieferando",
        providerOrderId: "PO-9",
        localOrderId: "L-9",
        status: "ready",
        updatedAt: "2026-07-25T10:30:00.000Z",
        soldAt: "2026-07-25T09:00:00.000Z",
      },
    ];
    const live = [
      {
        id: "pos-1",
        platform: "pos",
        providerOrderId: null,
        localOrderId: "POS-1",
        status: "completed",
        updatedAt: "2026-07-25T10:00:00.000Z",
        soldAt: "2026-07-25T09:30:00.000Z",
      },
    ];
    const provider = dedupeProviderOrders(providerRows);
    const all = [...live, ...provider];
    expect(provider).toHaveLength(1);
    expect(provider[0]?.id).toBe("web");
    expect(all).toHaveLength(2);
  });

  it("regression T1785113113966: localOrderId fallback, delivered once in recent list", () => {
    const provider = dedupeProviderOrders([
      {
        id: "created-copy",
        platform: "fake_delivery",
        providerOrderId: null,
        localOrderId: "T1785113113966",
        status: "created",
        updatedAt: "2026-07-27T00:45:15.000Z",
        soldAt: "2026-07-27T00:45:13.000Z",
      },
      {
        id: "delivered-copy",
        platform: "fake_delivery",
        providerOrderId: null,
        localOrderId: "T1785113113966",
        status: "delivered",
        updatedAt: "2026-07-27T00:45:27.000Z",
        soldAt: "2026-07-27T00:45:13.000Z",
      },
    ]);
    const liveCount = 4;
    const onlineOrders = provider.length;
    const totalOrders = liveCount + onlineOrders;
    const recentIds = provider.map((o) => o.localOrderId);
    expect(onlineOrders).toBe(1);
    expect(totalOrders).toBe(5);
    expect(provider[0]?.status).toBe("delivered");
    expect(recentIds.filter((id) => id === "T1785113113966")).toHaveLength(1);
  });
});
