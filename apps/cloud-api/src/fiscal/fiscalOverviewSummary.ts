import type { AdminFiscalOverviewRow } from "./fiscalConfigurationService.js";

export type FiscalOverviewSummary = {
  totalProfiles: number;
  germanyFiskalyPending: number;
  activeSetups: number;
  comingSoonCountries: number;
  standardReceiptMode: number;
};

export function computeFiscalOverviewSummary(
  items: AdminFiscalOverviewRow[],
): FiscalOverviewSummary {
  return {
    totalProfiles: items.length,
    germanyFiskalyPending: items.filter(
      (row) =>
        row.country === "DE" &&
        row.provider === "fiskaly" &&
        row.fiscalStatus !== "active",
    ).length,
    activeSetups: items.filter((row) => row.fiscalStatus === "active").length,
    comingSoonCountries: items.filter(
      (row) => row.providerType === "coming_soon",
    ).length,
    standardReceiptMode: items.filter(
      (row) =>
        row.providerType === "none" &&
        (row.fiscalStatus === "not_required" ||
          row.fiscalConfigurationLabel === "Standard receipt mode"),
    ).length,
  };
}
