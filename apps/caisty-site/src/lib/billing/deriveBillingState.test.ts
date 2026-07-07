import { describe, expect, it } from "vitest";
import {
  deriveBillingState,
  pickBillingPrimaryLicense,
  shouldShowUpgradePlans,
} from "./deriveBillingState";
import { portalEn } from "../translations/portal/en";

const baseCustomer = {
  id: "c1",
  orgId: "o1",
  name: "Alex",
  email: "alex@test.com",
  portalStatus: "active" as const,
  stripeBillingPortalEligible: true,
  paidBillingPeriod: "monthly" as const,
};

const baseLicense = {
  id: "l1",
  key: "KEY-123",
  plan: "starter",
  status: "active",
  maxDevices: 1,
  validUntil: "2026-12-31T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function makeInput(overrides: Partial<Parameters<typeof deriveBillingState>[0]> = {}) {
  return {
    customer: baseCustomer,
    primaryLicense: baseLicense,
    licenses: [baseLicense],
    licensesLoading: false,
    business: null,
    businessLoading: false,
    currency: "EUR",
    locale: "en-US",
    t: portalEn,
    ...overrides,
  };
}

describe("deriveBillingState", () => {
  it("derives subscription summary from real license data", () => {
    const state = deriveBillingState(makeInput());

    expect(state.subscriptionSummary.planLabel).toBe("Starter");
    expect(state.subscriptionSummary.statusLabel).toBe("Active");
    expect(state.subscriptionSummary.intervalLabel).toBe("Monthly");
    expect(state.subscriptionSummary.licenseKey).toBe("KEY-123");
    expect(state.subscriptionSummary.showManageSubscription).toBe(true);
    expect(state.subscriptionSummary.showPaymentEmpty).toBe(false);
  });

  it("derives overview KPIs from real license data", () => {
    const state = deriveBillingState(makeInput());

    expect(state.overview.find((k) => k.id === "plan")?.value).toBe("Starter");
    expect(state.overview.find((k) => k.id === "provider")?.value).toBe("Stripe");
  });

  it("shows payment empty when no stripe and no paid plan", () => {
    const trialLicense = { ...baseLicense, plan: "trial" };
    const state = deriveBillingState(
      makeInput({
        customer: { ...baseCustomer, stripeBillingPortalEligible: false },
        primaryLicense: trialLicense,
        licenses: [trialLicense],
      }),
    );

    expect(state.subscriptionSummary.showPaymentEmpty).toBe(true);
    expect(state.subscriptionSummary.showManageSubscription).toBe(false);
  });

  it("uses not configured for missing VAT profile fields", () => {
    const state = deriveBillingState(
      makeInput({
        primaryLicense: pickBillingPrimaryLicense([baseLicense]),
        business: {
          companyName: "",
          legalName: "",
          country: null,
          currency: "",
          defaultLanguage: "",
          businessAddress: {},
          vatId: "",
          taxId: "",
          fiscalStatus: "not_required",
          fiscalProvider: "",
          fiscalProviderDisplayKey: "",
          fiscalEnvironment: "",
          complianceStatus: "incomplete",
          posConfigurationStatus: "not_ready",
          fiscalPackage: "",
          receiptMode: "standard",
          posReadiness: "not_ready",
        },
      }),
    );

    expect(state.vatFields.find((f) => f.id === "vat")?.value).toBe(
      portalEn.billing.center.notConfigured,
    );
  });
});

describe("shouldShowUpgradePlans", () => {
  it("shows plans when no paid tier exists", () => {
    expect(shouldShowUpgradePlans([{ ...baseLicense, plan: "trial" }], null)).toBe(true);
  });

  it("shows plans for starter to allow pro upgrade", () => {
    expect(shouldShowUpgradePlans([baseLicense], "monthly")).toBe(true);
  });

  it("hides plans for pro on yearly billing", () => {
    const proLicense = { ...baseLicense, plan: "pro" };
    expect(shouldShowUpgradePlans([proLicense], "yearly")).toBe(false);
  });
});
