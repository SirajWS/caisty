import { describe, expect, it } from "vitest";
import { deriveBillingState, pickBillingPrimaryLicense } from "./deriveBillingState";
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

describe("deriveBillingState", () => {
  it("derives overview KPIs from real license data", () => {
    const state = deriveBillingState({
      customer: baseCustomer,
      primaryLicense: baseLicense,
      licensesLoading: false,
      business: null,
      businessLoading: false,
      currency: "EUR",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.overview.find((k) => k.id === "plan")?.value).toBe("Starter");
    expect(state.overview.find((k) => k.id === "provider")?.value).toBe("Stripe");
  });

  it("uses not configured for missing VAT profile fields", () => {
    const state = deriveBillingState({
      customer: baseCustomer,
      primaryLicense: pickBillingPrimaryLicense([baseLicense]),
      licensesLoading: false,
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
      businessLoading: false,
      currency: "EUR",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.vatFields.find((f) => f.id === "vat")?.value).toBe(
      portalEn.billing.center.notConfigured,
    );
  });
});
