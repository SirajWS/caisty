import { describe, expect, it } from "vitest";

import {
  getPlanPrice,
  grossPlanAmountCents,
  isYearlyPriceAvailable,
} from "../pricing.js";
import {
  describeStripePriceSelection,
  getStripePriceEnvVarName,
  getStripePriceId,
} from "../stripePrices.js";
import { maxDevicesForPlan } from "../licensePlans.js";
import { parseCheckoutPlanId } from "../../lib/billingPeriod.js";
import { evaluateCheckoutEligibility } from "../../lib/checkoutPlanEligibility.js";
import { catalogNetTaxGrossCents } from "../../lib/vatAmountBreakdown.js";
import { inferPaidBillingPeriodFromPriceCents } from "../../lib/inferPaidBillingPeriodFromPriceCents.js";

describe("Business EUR pricing catalog", () => {
  it("Business monthly = 3499 cents and yearly = 34900 cents", () => {
    expect(getPlanPrice("business", "EUR", "monthly")).toBe(34.99);
    expect(getPlanPrice("business", "EUR", "yearly")).toBe(349);
    expect(grossPlanAmountCents("business", "EUR", "monthly")).toBe(3499);
    expect(grossPlanAmountCents("business", "EUR", "yearly")).toBe(34900);
  });

  it("Business yearly is available in catalog (not blocked as missing)", () => {
    expect(isYearlyPriceAvailable("business", "EUR")).toBe(true);
  });

  it("parses business_yearly checkout plan id", () => {
    expect(parseCheckoutPlanId("business_yearly")).toEqual({
      plan: "business",
      period: "yearly",
    });
    expect(parseCheckoutPlanId("business_monthly")).toEqual({
      plan: "business",
      period: "monthly",
    });
  });

  it("keeps Business maxDevices null for monthly and yearly licenses", () => {
    expect(maxDevicesForPlan("business")).toBeNull();
  });

  it("maps Business yearly VAT breakdown from catalog", () => {
    expect(catalogNetTaxGrossCents("business", "EUR", "yearly")).toEqual({
      grossCents: 34900,
      netCents: 29328,
      taxCents: 5572,
      vatRate: 0.19,
    });
    expect(catalogNetTaxGrossCents("business", "EUR", "monthly")).toEqual({
      grossCents: 3499,
      netCents: 2940,
      taxCents: 559,
      vatRate: 0.19,
    });
  });

  it("infers Business yearly period from 34900 cents", () => {
    expect(
      inferPaidBillingPeriodFromPriceCents("business", "EUR", 34900),
    ).toBe("yearly");
    expect(
      inferPaidBillingPeriodFromPriceCents("business", "EUR", 3499),
    ).toBe("monthly");
  });

  it("allows Business yearly checkout when catalog yearly exists", () => {
    expect(
      evaluateCheckoutEligibility(null, "business", "yearly", {
        yearlyAvailable: isYearlyPriceAvailable("business", "EUR"),
      }),
    ).toEqual({ ok: true });
  });
});

describe("Business Stripe price resolution", () => {
  it("uses dedicated env var name for Business yearly", () => {
    expect(getStripePriceEnvVarName("business", "EUR", "yearly")).toBe(
      "STRIPE_PRICE_BUSINESS_YEARLY_EUR",
    );
    expect(getStripePriceEnvVarName("business", "EUR", "monthly")).toBe(
      "STRIPE_PRICE_BUSINESS_MONTHLY_EUR",
    );
  });

  it("does not invent a Stripe Price ID when Business yearly env is empty", () => {
    const businessYearly = getStripePriceId("business", "EUR", "yearly");
    const starterYearly = getStripePriceId("starter", "EUR", "yearly");
    const proYearly = getStripePriceId("pro", "EUR", "yearly");

    // Empty env → null. Never fall back to another plan's configured id.
    if (!process.env.STRIPE_PRICE_BUSINESS_YEARLY_EUR) {
      expect(businessYearly).toBeNull();
      if (starterYearly) {
        expect(businessYearly).not.toBe(starterYearly);
      }
      if (proYearly) {
        expect(businessYearly).not.toBe(proYearly);
      }
    }

    const map = describeStripePriceSelection({
      planId: "business_yearly",
      plan: "business",
      billingPeriod: "yearly",
      currency: "EUR",
    });
    expect(map.envVarName).toBe("STRIPE_PRICE_BUSINESS_YEARLY_EUR");
    expect(map.planId).toBe("business_yearly");
  });
});
