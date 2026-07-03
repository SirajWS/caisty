import { describe, expect, it } from "vitest";
import {
  derivePortalSetupSteps,
  isStepCountryCurrencyDone,
  isStepCompanyDone,
  isStepInstallDone,
  isStepLicensePlanDone,
} from "./derivePortalSetupSteps";
import type {
  PortalBusinessProfile,
  PortalInvoice,
  PortalLicense,
} from "./portalApi";

function business(
  overrides: Partial<PortalBusinessProfile> = {},
): PortalBusinessProfile {
  return {
    companyName: "Test GmbH",
    legalName: "Test GmbH",
    country: "DE",
    currency: "EUR",
    defaultLanguage: "de",
    businessAddress: { street: "A", city: "B", zip: "12345", country: "DE" },
    vatId: "",
    taxId: "",
    fiscalStatus: "pending_setup",
    fiscalProvider: "fiskaly",
    fiscalProviderDisplayKey: "de_fiskaly",
    fiscalRequired: true,
    fiscalEnvironment: "test",
    complianceStatus: "ready",
    posConfigurationStatus: "ready",
    fiscalPackage: "generic_standard",
    receiptMode: "standard",
    posReadiness: "ready",
    ...overrides,
  };
}

function license(status: string, plan = "starter"): PortalLicense {
  return {
    id: "lic-1",
    key: "KEY-1",
    plan,
    status,
    maxDevices: 1,
    validUntil: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("derivePortalSetupSteps", () => {
  it("marks step 1 done when country and currency are set", () => {
    expect(isStepCountryCurrencyDone(business())).toBe(true);
    expect(
      isStepCountryCurrencyDone(business({ country: null, currency: "EUR" })),
    ).toBe(false);
  });

  it("marks step 2 done when complianceStatus is ready", () => {
    expect(isStepCompanyDone(business())).toBe(true);
    expect(
      isStepCompanyDone(business({ complianceStatus: "incomplete" })),
    ).toBe(false);
  });

  it("marks step 3 done with active license", () => {
    expect(isStepLicensePlanDone([license("active")])).toBe(true);
    expect(isStepLicensePlanDone([license("expired")])).toBe(false);
  });

  it("marks step 3 done with pending open plan invoice", () => {
    const invoices: PortalInvoice[] = [
      {
        id: "inv-1",
        number: "INV-1",
        status: "open",
        plan: "starter",
        amountCents: 1000,
        currency: "EUR",
        createdAt: "2026-01-01T00:00:00.000Z",
        dueAt: null,
        periodStart: null,
        periodEnd: null,
      },
    ];
    expect(isStepLicensePlanDone([], null, invoices)).toBe(true);
  });

  it("marks step 4 done when at least one device is bound", () => {
    expect(isStepInstallDone(1)).toBe(true);
    expect(isStepInstallDone(0)).toBe(false);
  });

  it("returns current step as first incomplete step", () => {
    const state = derivePortalSetupSteps({
      business: business({ complianceStatus: "incomplete" }),
      licenses: [],
      deviceCount: 0,
    });
    expect(state.currentStepId).toBe("company");
    expect(state.remainingCount).toBe(3);
    expect(state.allDone).toBe(false);
  });

  it("returns allDone when every step is complete", () => {
    const state = derivePortalSetupSteps({
      business: business(),
      licenses: [license("active")],
      deviceCount: 2,
    });
    expect(state.allDone).toBe(true);
    expect(state.currentStepId).toBeNull();
    expect(state.remainingCount).toBe(0);
  });

  it("TN customer without fiscalRequired still uses same stepper (no fiscal step)", () => {
    const tnBusiness = business({
      country: "TN",
      currency: "TND",
      fiscalRequired: false,
      complianceStatus: "ready",
    });
    const state = derivePortalSetupSteps({
      business: tnBusiness,
      licenses: [license("active", "trial")],
      deviceCount: 1,
    });
    expect(state.allDone).toBe(true);
    expect(state.steps).toHaveLength(4);
  });
});
