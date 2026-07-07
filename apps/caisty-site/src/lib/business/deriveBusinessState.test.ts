import { describe, expect, it } from "vitest";
import { deriveBusinessState } from "./deriveBusinessState";
import { portalEn } from "../translations/portal/en";
import type { BusinessData } from "./types";

const baseCustomer = {
  id: "c1",
  orgId: "o1",
  name: "Alex",
  email: "alex@test.com",
  portalStatus: "active" as const,
};

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    companyName: "Caisty Café",
    legalName: "Caisty Café GmbH",
    country: "DE",
    currency: "EUR",
    defaultLanguage: "de",
    businessAddress: { street: "Main 1", city: "Berlin", zip: "10115", country: "DE" },
    vatId: "DE123",
    taxId: "TAX1",
    fiscalStatus: "pending_setup" as const,
    fiscalProvider: "fiskaly",
    fiscalProviderDisplayKey: "fiskaly",
    fiscalEnvironment: "sandbox",
    complianceStatus: "ready" as const,
    posConfigurationStatus: "ready" as const,
    fiscalPackage: "de_fiskaly_api",
    receiptMode: "standard_until_certified" as const,
    posReadiness: "ready" as const,
    fiscalRequired: true,
    ...overrides,
  };
}

function makeData(overrides: Partial<BusinessData> = {}): BusinessData {
  return {
    licenses: [],
    devices: [],
    invoices: [],
    business: makeProfile(),
    customer: baseCustomer,
    loading: false,
    error: false,
    lastSyncedAt: new Date("2026-07-05T10:00:00Z"),
    ...overrides,
  };
}

describe("deriveBusinessState", () => {
  it("derives compact fiscal summary from profile", () => {
    const state = deriveBusinessState({
      data: makeData(),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.hasProfile).toBe(true);
    expect(state.fiscalSummary.find((f) => f.id === "country")?.value).toBe("Germany");
    expect(state.fiscalSummary.find((f) => f.id === "provider")?.value).toContain("Fiskaly");
    expect(state.fiscalSummary.find((f) => f.id === "vat_status")?.value).toBe("Configured");
  });

  it("shows not configured fiscal summary when profile is missing", () => {
    const state = deriveBusinessState({
      data: makeData({ business: null }),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.hasProfile).toBe(false);
    expect(state.setup.percent).toBe(0);
    expect(state.setup.missingItems).toContain("Business profile");
    expect(state.fiscalSummary.every((f) => f.id === "vat_status" || f.value === "Not configured")).toBe(
      true,
    );
  });

  it("tracks business-only setup progress and missing fiscal activation", () => {
    const state = deriveBusinessState({
      data: makeData(),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.setup.percent).toBe(89);
    expect(state.setup.missingItems).toContain("Fiscal activation");
    expect(state.setup.complete).toBe(false);
  });

  it("marks setup complete when fiscal is active and fields are filled", () => {
    const state = deriveBusinessState({
      data: makeData({ business: makeProfile({ fiscalStatus: "active" }) }),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.setup.percent).toBe(100);
    expect(state.setup.complete).toBe(true);
    expect(state.setup.missingItems).toHaveLength(0);
  });

  it("lists missing VAT and tax fields in setup progress", () => {
    const state = deriveBusinessState({
      data: makeData({
        business: makeProfile({ vatId: "", taxId: "" }),
      }),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.setup.missingItems).toContain("VAT ID");
    expect(state.setup.missingItems).toContain("Tax number");
  });
});
