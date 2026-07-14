import { describe, expect, it } from "vitest";

import {
  isProviderOrder,
  normalizeOrderSource,
  ORDER_SOURCE,
} from "../orderSource.js";

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
});
