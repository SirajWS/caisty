import type { AdminFiscalOverviewRow } from "./fiscalConfigurationService.js";

export type FiscalOverviewSummary = {
  totalProfiles: number;
  /** @deprecated Use fiscalRequiredPending — kept for existing consumers */
  germanyFiskalyPending: number;
  fiscalRequiredPending: number;
  activeSetups: number;
  comingSoonCountries: number;
  standardReceiptMode: number;
  actionNeeded: number;
  allOk: number;
  fiscalCountriesActive: number;
  withoutFiscalization: number;
};

type AmpelInput = Pick<
  AdminFiscalOverviewRow,
  "country" | "fiscalStatus" | "fiscalRequired"
>;

export type FiscalAmpelTone = "green" | "yellow" | "red" | "gray";

export function deriveFiscalAmpelTone(input: AmpelInput): FiscalAmpelTone {
  if (!input.country) return "gray";
  if (input.fiscalStatus === "error") return "red";
  if (
    input.fiscalStatus === "pending_setup" ||
    input.fiscalStatus === "required" ||
    input.fiscalStatus === "required_soon"
  ) {
    return "yellow";
  }
  if (input.fiscalStatus === "active") return "green";
  if (input.fiscalStatus === "not_required" || !input.fiscalRequired) {
    return "green";
  }
  return "green";
}

export function isFiscalActionNeeded(input: AmpelInput): boolean {
  const tone = deriveFiscalAmpelTone(input);
  return tone === "red" || tone === "yellow";
}

export function computeFiscalOverviewSummary(
  items: AdminFiscalOverviewRow[],
): FiscalOverviewSummary {
  const fiscalRequiredPending = items.filter(
    (row) => row.fiscalRequired && row.fiscalStatus === "pending_setup",
  ).length;

  const fiscalRequiredCountries = new Set<string>();
  for (const row of items) {
    if (row.fiscalRequired && row.country) {
      fiscalRequiredCountries.add(row.country);
    }
  }

  return {
    totalProfiles: items.length,
    germanyFiskalyPending: fiscalRequiredPending,
    fiscalRequiredPending,
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
    actionNeeded: items.filter((row) => isFiscalActionNeeded(row)).length,
    allOk: items.filter(
      (row) => deriveFiscalAmpelTone(row) === "green",
    ).length,
    fiscalCountriesActive: fiscalRequiredCountries.size,
    withoutFiscalization: items.filter((row) => !row.fiscalRequired).length,
  };
}
