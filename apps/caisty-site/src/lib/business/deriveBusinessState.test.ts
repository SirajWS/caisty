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
  it("uses real profile fields without inventing owner or store id", () => {
    const state = deriveBusinessState({
      data: makeData(),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.overview.find((k) => k.id === "name")?.value).toBe("Caisty Café");
    expect(state.company.find((f) => f.id === "owner")?.value).toBe("Not configured");
    expect(state.store.find((f) => f.id === "store_id")?.value).toBe("Not configured");
    expect(state.contact.find((f) => f.id === "email")?.value).toBe("alex@test.com");
    expect(state.hasProfile).toBe(true);
  });

  it("shows not configured when profile is missing", () => {
    const state = deriveBusinessState({
      data: makeData({ business: null }),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    expect(state.hasProfile).toBe(false);
    expect(state.company.every((f) => f.value === "Not configured")).toBe(true);
    expect(state.completionPercent).toBe(0);
  });

  it("enables edit business quick action", () => {
    const state = deriveBusinessState({
      data: makeData(),
      environmentLabel: "staging",
      locale: "en-US",
      t: portalEn,
    });

    const edit = state.quickActions.find((a) => a.id === "edit");
    expect(edit?.disabled).toBe(false);
    expect(edit?.action).toBe("scroll_to_edit");
  });
});
