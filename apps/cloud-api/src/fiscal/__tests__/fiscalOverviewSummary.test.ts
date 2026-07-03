import { describe, expect, it } from "vitest";
import {
  computeFiscalOverviewSummary,
  deriveFiscalAmpelTone,
  isFiscalActionNeeded,
} from "../fiscalOverviewSummary.js";
import type { AdminFiscalOverviewRow } from "../fiscalConfigurationService.js";

function row(
  partial: Partial<AdminFiscalOverviewRow> & Pick<AdminFiscalOverviewRow, "fiscalRequired">,
): AdminFiscalOverviewRow {
  return {
    orgId: "org-1",
    country: partial.country ?? "DE",
    currency: "EUR",
    provider: partial.fiscalRequired ? "fiskaly" : "none",
    providerType: partial.fiscalRequired ? "api_service" : "none",
    providerName: null,
    providerLabel: "Test",
    fiscalStatus: partial.fiscalStatus ?? "pending_setup",
    fiscalStatusCustomer: partial.fiscalStatus ?? "pending_setup",
    fiscalEnvironment: "not_configured",
    receiptMode: "certified",
    fiscalProfileKey: "test",
    fiscalConfigurationLabel: "Test",
    supportedExports: [],
    posDownloadAllowed: true,
    posConfigurationStatus: "not_ready",
    fiscalNotice: null,
    mode: "api_service",
    ...partial,
  };
}

describe("fiscalOverviewSummary", () => {
  it("counts fiscalRequiredPending instead of DE-only", () => {
    const items = [
      row({ fiscalRequired: true, country: "DE", fiscalStatus: "pending_setup" }),
      row({ fiscalRequired: true, country: "AT", fiscalStatus: "pending_setup" }),
      row({ fiscalRequired: false, country: "TN", fiscalStatus: "not_required" }),
    ];
    const summary = computeFiscalOverviewSummary(items);
    expect(summary.fiscalRequiredPending).toBe(2);
    expect(summary.germanyFiskalyPending).toBe(2);
    expect(summary.withoutFiscalization).toBe(1);
  });

  it("computes actionNeeded and allOk from ampel tones", () => {
    const items = [
      row({ fiscalRequired: true, fiscalStatus: "pending_setup" }),
      row({ fiscalRequired: true, fiscalStatus: "active" }),
      row({ fiscalRequired: false, country: "TN", fiscalStatus: "not_required" }),
    ];
    const summary = computeFiscalOverviewSummary(items);
    expect(summary.actionNeeded).toBe(1);
    expect(summary.allOk).toBe(2);
  });

  it("counts distinct fiscal countries", () => {
    const items = [
      row({ fiscalRequired: true, country: "DE", fiscalStatus: "active" }),
      row({ fiscalRequired: true, country: "DE", fiscalStatus: "pending_setup", orgId: "org-2" }),
      row({ fiscalRequired: true, country: "AT", fiscalStatus: "pending_setup", orgId: "org-3" }),
    ];
    expect(computeFiscalOverviewSummary(items).fiscalCountriesActive).toBe(2);
  });
});

describe("deriveFiscalAmpelTone", () => {
  it("DE pending → yellow", () => {
    expect(
      deriveFiscalAmpelTone({
        country: "DE",
        fiscalRequired: true,
        fiscalStatus: "pending_setup",
      }),
    ).toBe("yellow");
  });

  it("TN not required → green", () => {
    expect(
      deriveFiscalAmpelTone({
        country: "TN",
        fiscalRequired: false,
        fiscalStatus: "not_required",
      }),
    ).toBe("green");
  });

  it("no country → gray", () => {
    expect(
      deriveFiscalAmpelTone({
        country: null,
        fiscalRequired: false,
        fiscalStatus: "not_required",
      }),
    ).toBe("gray");
  });

  it("error → red", () => {
    expect(isFiscalActionNeeded({
      country: "DE",
      fiscalRequired: true,
      fiscalStatus: "error",
    })).toBe(true);
  });
});
