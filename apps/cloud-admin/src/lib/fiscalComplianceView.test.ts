import { describe, expect, it } from "vitest";
import type { AdminFiscalOverviewItem } from "./fiscalApi";
import {
  deriveFiscalAmpel,
  filterFiscalOverviewItems,
  groupFiscalOverviewItems,
  isFiscalActionNeeded,
} from "./fiscalComplianceView";

function item(
  partial: Partial<AdminFiscalOverviewItem> & Pick<AdminFiscalOverviewItem, "fiscalRequired">,
): AdminFiscalOverviewItem {
  return {
    customerId: partial.customerId ?? "cust-1",
    customerName: "Test GmbH",
    customerEmail: "test@example.com",
    orgId: "org-1",
    country: partial.country ?? "DE",
    currency: "EUR",
    provider: partial.fiscalRequired ? "fiskaly" : "none",
    providerType: partial.fiscalRequired ? "api_service" : "none",
    providerName: null,
    providerLabel: "Test",
    fiscalConfigurationLabel: "Test",
    fiscalStatus: partial.fiscalStatus ?? "pending_setup",
    fiscalEnvironment: "not_configured",
    receiptMode: "certified",
    fiscalProfileKey: "test",
    posConfigurationStatus: "not_ready",
    posDownloadAllowed: true,
    supportedExports: [],
    lastSyncAt: null,
    actions: {
      startSetup: false,
      markActive: false,
      markPending: false,
      viewLogs: false,
    },
    ...partial,
  };
}

describe("fiscalComplianceView", () => {
  it("DE pending → group A yellow", () => {
    const row = item({ fiscalRequired: true, fiscalStatus: "pending_setup" });
    expect(groupFiscalOverviewItems([row]).fiscalRequired).toHaveLength(1);
    expect(deriveFiscalAmpel(row).tone).toBe("yellow");
    expect(deriveFiscalAmpel(row).label).toBe("Setup running");
  });

  it("TN → group B green", () => {
    const row = item({
      fiscalRequired: false,
      country: "TN",
      fiscalStatus: "not_required",
    });
    expect(groupFiscalOverviewItems([row]).noFiscalRequired).toHaveLength(1);
    expect(deriveFiscalAmpel(row).tone).toBe("green");
  });

  it("no country → group B gray", () => {
    const row = item({
      fiscalRequired: false,
      country: null,
      fiscalStatus: "not_required",
    });
    expect(deriveFiscalAmpel(row).tone).toBe("gray");
    expect(deriveFiscalAmpel(row).label).toBe("No country selected");
  });

  it("sorts action-needed customers first", () => {
    const ok = item({
      customerId: "a",
      customerName: "Alpha",
      fiscalRequired: true,
      fiscalStatus: "active",
    });
    const pending = item({
      customerId: "b",
      customerName: "Beta",
      fiscalRequired: true,
      fiscalStatus: "pending_setup",
    });
    const sorted = filterFiscalOverviewItems([ok, pending], {
      search: "",
      statusFilter: "all",
    });
    expect(sorted[0].customerId).toBe("b");
    expect(isFiscalActionNeeded(pending)).toBe(true);
  });

  it("filters by status", () => {
    const rows = [
      item({ customerId: "1", fiscalRequired: true, fiscalStatus: "active" }),
      item({ customerId: "2", fiscalRequired: true, fiscalStatus: "pending_setup" }),
      item({ customerId: "3", fiscalRequired: false, country: null, fiscalStatus: "not_required" }),
    ];
    expect(
      filterFiscalOverviewItems(rows, { search: "", statusFilter: "setup_running" }),
    ).toHaveLength(1);
    expect(
      filterFiscalOverviewItems(rows, { search: "", statusFilter: "no_country" }),
    ).toHaveLength(1);
  });
});
