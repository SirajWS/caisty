import { describe, expect, it } from "vitest";

import { attachOperationalOnlineCurrency } from "../portalSalesSummary.js";

describe("attachOperationalOnlineCurrency", () => {
  it("replaces empty EUR online summaries with the business currency", () => {
    expect(
      attachOperationalOnlineCurrency(
        {
          cashPaidCents: 0,
          cardPaidCents: 0,
          onlinePaidCents: 0,
          pendingCents: 0,
          currency: "EUR",
        },
        "TND",
      ).currency,
    ).toBe("TND");
  });

  it("keeps historical online payment currency when amounts exist", () => {
    expect(
      attachOperationalOnlineCurrency(
        {
          cashPaidCents: 0,
          cardPaidCents: 2500,
          onlinePaidCents: 0,
          pendingCents: 0,
          currency: "EUR",
        },
        "TND",
      ).currency,
    ).toBe("EUR");
  });
});
