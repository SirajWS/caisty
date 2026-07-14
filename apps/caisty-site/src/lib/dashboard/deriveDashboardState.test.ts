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
    posRevenueCents: 0,
    onlineRevenueCents: 0,
    ordersToday: 0,
    liveOrdersCount: 0,
    onlineOrdersCount: 0,
    receiptsToday: 0,
    refundsCount: 0,
    averageOrderMinor: 0,
    currency: "EUR",
    lastSynchronizationAt: null,
    hasSalesData: false,
    paymentSummary: {
      cashCents: 0,
      cardCents: 0,
      voucherCents: 0,
      otherCents: 0,
      currency: "EUR",
    },
    recentOrders: [],
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
    salesSummaryError: false,
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

  it("formats TND payment summary with millimes (not /100)", () => {
    const state = deriveDashboardState(
      deriveInput(
        makeData({
          salesSummary: salesSummary({
            todayRevenueCents: 453000,
            posRevenueCents: 441000,
            onlineRevenueCents: 12000,
            ordersToday: 32,
            liveOrdersCount: 27,
            onlineOrdersCount: 5,
            receiptsToday: 27,
            averageOrderMinor: 16778,
            currency: "TND",
            hasSalesData: true,
            paymentSummary: {
              cashCents: 441000,
              cardCents: 12000,
              voucherCents: 0,
              otherCents: 0,
              currency: "TND",
            },
          }),
        }),
      ),
    );

    const cash = state.paymentCards.find((p) => p.id === "cash");
    const card = state.paymentCards.find((p) => p.id === "card");
    const revenue = state.kpis.find((k) => k.id === "revenue");
    const orders = state.kpis.find((k) => k.id === "orders");

    expect(revenue?.value).toContain("453.000");
    expect(revenue?.hint).toContain("441.000");
    expect(revenue?.hint).toContain("12.000");
    expect(cash?.value).toContain("441.000");
    expect(card?.value).toContain("12.000");
    expect(cash?.value).not.toContain("4,410");
    expect(card?.value).not.toContain("120.000");
    expect(orders?.value).toBe("32");
    expect(orders?.hint).toContain("27");
    expect(orders?.hint).toContain("5");
  });

  it("counts orders today as live plus online orders", () => {
    const state = deriveDashboardState(
      deriveInput(
        makeData({
          salesSummary: salesSummary({
            ordersToday: 32,
            liveOrdersCount: 27,
            onlineOrdersCount: 5,
            receiptsToday: 27,
            todayRevenueCents: 453000,
            currency: "TND",
            hasSalesData: true,
          }),
        }),
      ),
    );

    const orders = state.kpis.find((k) => k.id === "orders");
    expect(orders?.value).toBe("32");
  });

  it("shows five KPIs without employees placeholder", () => {
    const state = deriveDashboardState(deriveInput(makeData()));
    expect(state.kpis.map((k) => k.id)).toEqual([
      "revenue",
      "orders",
      "avg_order",
      "pos_status",
      "last_sync",
    ]);
    expect(state.kpis.find((k) => k.id === "employees")).toBeUndefined();
  });

  it("shows real revenue, orders and average order when POS data exists", () => {
    const state = deriveDashboardState(
      deriveInput(
        makeData({
          salesSummary: salesSummary({
            todayRevenueCents: 572800,
            posRevenueCents: 572800,
            onlineRevenueCents: 0,
            ordersToday: 10,
            receiptsToday: 10,
            averageOrderMinor: 57280,
            currency: "TND",
            lastSynchronizationAt: "2026-07-08T10:00:00.000Z",
            hasSalesData: true,
          }),
        }),
      ),
    );

    const revenue = state.kpis.find((k) => k.id === "revenue");
    const orders = state.kpis.find((k) => k.id === "orders");
    const avgOrder = state.kpis.find((k) => k.id === "avg_order");
    const lastSync = state.kpis.find((k) => k.id === "last_sync");

    expect(revenue?.status).toBe("value");
    // 572800 millimes (TND) → 572.800, formatted with minor units ÷1000
    expect(revenue?.value).toContain("572.800");
    expect(revenue?.hint).toContain("572.800");
    expect(orders?.value).toBe("10");
    expect(avgOrder?.value).toContain("57.280");
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

  it("excludes offline devices and stale invoices from activity feed", () => {
    const state = deriveDashboardState(
      deriveInput(
        makeData({
          invoices: [invoice("old", "2020-01-01T12:00:00Z", "paid")],
          devices: [
            {
              id: "d-off",
              name: "Till offline",
              deviceId: "dev-off",
              lastSeenAt: "2026-07-05T09:00:00Z",
              status: "offline",
              licenseKey: "KEY",
            },
            {
              id: "d-on",
              name: "Till online",
              deviceId: "dev-on",
              lastSeenAt: "2026-07-08T09:00:00Z",
              status: "online",
              licenseKey: "KEY",
            },
          ],
          salesSummary: salesSummary({
            lastSynchronizationAt: "2026-07-08T10:00:00.000Z",
            hasSalesData: true,
          }),
        }),
      ),
    );

    expect(state.activities.some((a) => a.id.startsWith("inv-"))).toBe(false);
    expect(state.activities.some((a) => a.id === "dev-d-off")).toBe(false);
    expect(state.activities.some((a) => a.id === "dev-d-on")).toBe(true);
    expect(state.activities.some((a) => a.id === "cloud-sync")).toBe(true);
    expect(state.activities.find((a) => a.id === "cloud-sync")?.at).toBe(
      "2026-07-08T10:00:00.000Z",
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
