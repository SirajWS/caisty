import { describe, expect, it } from "vitest";
import {
  financialCurrencyScope,
  formatCurrencyExclusionBanner,
} from "./financialCurrencyScope";

describe("financialCurrencyScope", () => {
  it("shows TND money and a banner for the mixed-history fixture", () => {
    const scope = financialCurrencyScope({
      financialCurrency: "TND",
      mixedCurrency: true,
      excludedTransactionCount: 2,
    });
    expect(scope.showMoney).toBe(true);
    expect(scope.showExclusionBanner).toBe(true);
    expect(
      formatCurrencyExclusionBanner({
        summary: {
          financialCurrency: "TND",
          excludedTransactionCount: 2,
        },
        warning:
          "Financial totals in {{currency}} only. {{count}} historical transactions in another currency are excluded.",
      }),
    ).toBe(
      "Financial totals in TND only. 2 historical transactions in another currency are excluded.",
    );
  });

  it("hides the banner when every sale uses the active currency", () => {
    expect(
      financialCurrencyScope({
        financialCurrency: "TND",
        mixedCurrency: false,
        excludedTransactionCount: 0,
      }).showExclusionBanner,
    ).toBe(false);
  });

  it("keeps a filtered zero as a real TND total when only foreign history exists", () => {
    const scope = financialCurrencyScope({
      financialCurrency: "TND",
      mixedCurrency: true,
      excludedTransactionCount: 2,
    });
    expect(scope.showMoney).toBe(true);
    expect(scope.showExclusionBanner).toBe(true);
  });
});
