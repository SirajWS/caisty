import { describe, expect, it } from "vitest";
import {
  PRICING,
  MAX_DEVICES,
  formatLandingPlanPriceLine,
  isYearlyPlanAvailable,
  resolvePlanPrice,
} from "./pricing";
import { evaluateCheckoutEligibility } from "../lib/checkoutPlanEligibility";
import { pricing } from "../lib/translations/pricing";

describe("Business yearly public pricing", () => {
  it("exposes Business 349 € / year and unlimited devices", () => {
    expect(PRICING.EUR.business.monthly).toBe(34.99);
    expect(PRICING.EUR.business.yearly).toBe(349);
    expect(MAX_DEVICES.business).toBeNull();
    expect(isYearlyPlanAvailable("business", "EUR")).toBe(true);
    expect(resolvePlanPrice("business", "yearly", "EUR")).toEqual({
      amount: 349,
      currency: "EUR",
    });
  });

  it("formats yearly Business line without Not available wording", () => {
    const resolved = resolvePlanPrice("business", "yearly", "EUR")!;
    const en = formatLandingPlanPriceLine(
      resolved.amount,
      resolved.currency,
      "en",
      "yearly",
      pricing.en.priceYearlySuffix,
    );
    const de = formatLandingPlanPriceLine(
      resolved.amount,
      resolved.currency,
      "de",
      "yearly",
      pricing.de.priceYearlySuffix,
    );
    const fr = formatLandingPlanPriceLine(
      resolved.amount,
      resolved.currency,
      "fr",
      "yearly",
      pricing.fr.priceYearlySuffix,
    );
    const ar = formatLandingPlanPriceLine(
      resolved.amount,
      resolved.currency,
      "ar",
      "yearly",
      pricing.ar.priceYearlySuffix,
    );

    expect(en).toBe("349 € / year");
    expect(de).toBe("349 € / Jahr");
    expect(fr).toBe("349 € / an");
    expect(ar).toContain("349");
    for (const line of [en, de, fr, ar]) {
      expect(line.toLowerCase()).not.toContain("not available");
      expect(line.toLowerCase()).not.toContain("noch nicht");
      expect(line.toLowerCase()).not.toContain("pas encore");
    }
  });

  it("keeps Unlimited device labels in DE/EN/FR/AR", () => {
    expect(pricing.en.plans.business.devicesUnlimited).toBe(
      "Unlimited POS devices",
    );
    expect(pricing.de.plans.business.devicesUnlimited).toBe(
      "Unbegrenzte POS-Geräte",
    );
    expect(pricing.fr.plans.business.devicesUnlimited).toBe(
      "Appareils POS illimités",
    );
    expect(pricing.ar.plans.business.devicesUnlimited.length).toBeGreaterThan(0);
  });

  it("allows portal Business yearly checkout eligibility", () => {
    expect(
      evaluateCheckoutEligibility(null, "business", "yearly", {
        yearlyAvailable: isYearlyPlanAvailable("business", "EUR"),
      }),
    ).toEqual({ ok: true });
  });

  it("shows all three yearly catalog prices for portal cards", () => {
    expect(resolvePlanPrice("starter", "yearly", "EUR")?.amount).toBe(149);
    expect(resolvePlanPrice("pro", "yearly", "EUR")?.amount).toBe(299);
    expect(resolvePlanPrice("business", "yearly", "EUR")?.amount).toBe(349);
  });
});
