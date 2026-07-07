import { describe, expect, it } from "vitest";
import { deriveDashboardState, countOnlineDevices } from "./deriveDashboardState";
import { getPosReleaseConfig } from "../../config/posConfig";
import { portalEn } from "../translations/portal/en";
import type { DashboardData } from "./types";
import type {
  PortalBusinessProfile,
  PortalInvoice,
  PortalLicense,
} from "../portalApi";

const baseCustomer = {
  id: "c1",
  orgId: "o1",
  name: "Alex Owner",
  email: "alex@shop.test",
  portalStatus: "active" as const,
};

function business(
  overrides: Partial<PortalBusinessProfile> = {},
): PortalBusinessProfile {
  return {
    companyName: "Demo Shop",
    legalName: "Demo Shop GmbH",
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
    id: "l1",
    key: "KEY",
    plan,
    status,
    maxDevices: 2,
    validUntil: null,
    createdAt: "2026-01-01T00:00:00Z",
  };
}

function invoice(
  id: string,
  createdAt: string,
  status: string,
): PortalInvoice {
  return {
    id,
    number: `INV-${id}`,
    status,
    amountCents: 1000,
    currency: "EUR",
    createdAt,
    dueAt: null,
    periodStart: null,
    periodEnd: null,
    plan: null,
  };
}

function makeData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    licenses: [],
    devices: [],
    invoices: [],
    business: null,
    customer: baseCustomer,
    loading: false,
    error: false,
    lastSyncedAt: new Date("2026-07-05T10:00:00Z"),
    ...overrides,
  };
}

describe("deriveDashboardState", () => {
  it("does not invent revenue — KPI shows coming soon", () => {
    const state = deriveDashboardState({
      data: makeData(),
      release: getPosReleaseConfig(),
      t: portalEn,
      environmentLabel: "development",
    });

    const revenue = state.kpis.find((k) => k.id === "revenue");
    expect(revenue?.status).toBe("waiting_sync");
    expect(revenue?.value).toBe("—");
    expect(revenue?.hint).toContain("POS sync");
  });

  it("computes health score from readiness checks", () => {
    const state = deriveDashboardState({
      data: makeData({
        licenses: [license("active")],
        devices: [
          {
            id: "d1",
            name: "Till 1",
            deviceId: "dev-1",
            lastSeenAt: "2026-07-05T09:00:00Z",
            status: "online",
            licenseKey: "KEY",
          },
        ],
        business: business(),
      }),
      release: getPosReleaseConfig(),
      t: portalEn,
      environmentLabel: "production",
    });

    expect(state.health.score).toBeGreaterThanOrEqual(60);
    expect(state.businessName).toBe("Demo Shop");
  });

  it("sorts recent activity newest first", () => {
    const state = deriveDashboardState({
      data: makeData({
        invoices: [
          invoice("i1", "2026-07-04T12:00:00Z", "paid"),
          invoice("i2", "2026-07-05T08:00:00Z", "open"),
        ],
      }),
      release: getPosReleaseConfig(),
      t: portalEn,
      environmentLabel: "staging",
    });

    expect(state.activities.length).toBeGreaterThanOrEqual(2);
    expect(new Date(state.activities[0].at).getTime()).toBeGreaterThan(
      new Date(state.activities[1].at).getTime(),
    );
  });
});

describe("countOnlineDevices", () => {
  it("counts online devices", () => {
    expect(
      countOnlineDevices([
        { id: "1", name: "A", deviceId: "a", lastSeenAt: null, status: "online", licenseKey: null },
        { id: "2", name: "B", deviceId: "b", lastSeenAt: null, status: "offline", licenseKey: null },
      ]),
    ).toEqual({ online: 1, total: 2 });
  });
});
