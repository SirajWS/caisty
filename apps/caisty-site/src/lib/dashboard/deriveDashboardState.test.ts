import { describe, expect, it } from "vitest";
import { deriveDashboardState, countOnlineDevices } from "./deriveDashboardState";
import { getPosReleaseConfig } from "../../config/posConfig";
import { portalEn } from "../translations/portal/en";
import type { DashboardData } from "./types";
import type {
  PortalBusinessProfile,
  PortalDashboardSummary,
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

function salesSummary(
  overrides: Partial<PortalDashboardSummary> = {},
): PortalDashboardSummary {
  return {
    timezone: "Europe/Berlin",
    period: "today",
    todayRevenueCents: 0,
    ordersToday: 0,
    receiptsToday: 0,
    currency: "EUR",
    lastSynchronizationAt: null,
    hasSalesData: false,
    ...overrides,
  };
}

function makeData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    licenses: [],
    devices: [],
    invoices: [],
    business: null,
    customer: baseCustomer,
    salesSummary: null,
    loading: false,
    error: false,
    lastSyncedAt: new Date("2026-07-05T10:00:00Z"),
    ...overrides,
  };
}

const deriveInput = (data: DashboardData) => ({
  data,
  release: getPosReleaseConfig(),
  t: portalEn,
  environmentLabel: "development",
  locale: "en-GB",
});

describe("deriveDashboardState", () => {
  it("keeps placeholders when no POS sales summary exists", () => {
    const state = deriveDashboardState(deriveInput(makeData()));

    const revenue = state.kpis.find((k) => k.id === "revenue");
    expect(revenue?.status).toBe("waiting_sync");
    expect(revenue?.value).toBe("—");
    expect(revenue?.hint).toContain("POS sync");
  });

  it("shows real revenue, orders and receipts when POS data exists", () => {
    const state = deriveDashboardState(
      deriveInput(
        makeData({
          salesSummary: salesSummary({
            todayRevenueCents: 572800,
            ordersToday: 10,
            receiptsToday: 10,
            currency: "TND",
            lastSynchronizationAt: "2026-07-08T10:00:00.000Z",
            hasSalesData: true,
          }),
        }),
      ),
    );

    const revenue = state.kpis.find((k) => k.id === "revenue");
    const orders = state.kpis.find((k) => k.id === "orders");
    const receipts = state.kpis.find((k) => k.id === "receipts");
    const lastSync = state.kpis.find((k) => k.id === "last_sync");

    expect(revenue?.status).toBe("value");
    // 572800 millimes (TND) → 572.800, formatted with minor units ÷1000
    expect(revenue?.value).toContain("572.800");
    expect(revenue?.hint).toBeUndefined();
    expect(orders?.value).toBe("10");
    expect(receipts?.value).toBe("10");
    expect(lastSync?.status).toBe("value");
  });

  it("formats EUR revenue with 2 decimals (÷100)", () => {
    const state = deriveDashboardState(
      deriveInput(
        makeData({
          salesSummary: salesSummary({
            todayRevenueCents: 600,
            ordersToday: 1,
            receiptsToday: 1,
            currency: "EUR",
            lastSynchronizationAt: "2026-07-08T10:00:00.000Z",
            hasSalesData: true,
          }),
        }),
      ),
    );

    const revenue = state.kpis.find((k) => k.id === "revenue");
    expect(revenue?.value).toContain("6.00");
  });

  it("computes health score from readiness checks", () => {
    const state = deriveDashboardState(
      deriveInput(
        makeData({
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
      ),
    );

    expect(state.health.score).toBeGreaterThanOrEqual(60);
    expect(state.businessName).toBe("Demo Shop");
  });

  it("sorts recent activity newest first", () => {
    const state = deriveDashboardState(
      deriveInput(
        makeData({
          invoices: [
            invoice("i1", "2026-07-04T12:00:00Z", "paid"),
            invoice("i2", "2026-07-05T08:00:00Z", "open"),
          ],
        }),
      ),
    );

    expect(state.activities.length).toBeGreaterThanOrEqual(2);
    expect(new Date(state.activities[0].at).getTime()).toBeGreaterThan(
      new Date(state.activities[1].at).getTime(),
    );
  });

  it("prefers lastSynchronizationAt from sales summary for last sync KPI", () => {
    const state = deriveDashboardState(
      deriveInput(
        makeData({
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
          salesSummary: salesSummary({
            ordersToday: 1,
            receiptsToday: 1,
            todayRevenueCents: 1000,
            currency: "EUR",
            lastSynchronizationAt: "2026-07-08T12:30:00.000Z",
            hasSalesData: true,
          }),
        }),
      ),
    );

    const lastSync = state.kpis.find((k) => k.id === "last_sync");
    expect(lastSync?.status).toBe("value");
    expect(lastSync?.value).toContain("2026");
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
