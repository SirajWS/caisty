import type { AdminFiscalOverviewItem } from "./fiscalApi";

export type FiscalAmpelTone = "green" | "yellow" | "red" | "gray";

export type FiscalAmpel = {
  tone: FiscalAmpelTone;
  label: string;
};

export type FiscalStatusFilter =
  | "all"
  | "action_needed"
  | "setup_running"
  | "ok"
  | "no_country";

const AMPEL_LABELS: Record<FiscalAmpelTone, string> = {
  green: "Active",
  yellow: "Setup running",
  red: "Error",
  gray: "No country selected",
};

export function deriveFiscalAmpel(row: AdminFiscalOverviewItem): FiscalAmpel {
  if (!row.country) {
    return { tone: "gray", label: AMPEL_LABELS.gray };
  }
  if (row.fiscalStatus === "error") {
    return { tone: "red", label: AMPEL_LABELS.red };
  }
  if (
    row.fiscalStatus === "pending_setup" ||
    row.fiscalStatus === "required" ||
    row.fiscalStatus === "required_coming_soon"
  ) {
    return { tone: "yellow", label: AMPEL_LABELS.yellow };
  }
  if (row.fiscalStatus === "active") {
    return { tone: "green", label: AMPEL_LABELS.green };
  }
  if (row.fiscalStatus === "not_required" || !row.fiscalRequired) {
    return { tone: "green", label: AMPEL_LABELS.green };
  }
  return { tone: "green", label: AMPEL_LABELS.green };
}

export function isFiscalActionNeeded(row: AdminFiscalOverviewItem): boolean {
  const tone = deriveFiscalAmpel(row).tone;
  return tone === "red" || tone === "yellow";
}

export function groupFiscalOverviewItems(items: AdminFiscalOverviewItem[]): {
  fiscalRequired: AdminFiscalOverviewItem[];
  noFiscalRequired: AdminFiscalOverviewItem[];
} {
  const fiscalRequired: AdminFiscalOverviewItem[] = [];
  const noFiscalRequired: AdminFiscalOverviewItem[] = [];

  for (const item of items) {
    if (item.fiscalRequired) fiscalRequired.push(item);
    else noFiscalRequired.push(item);
  }

  return { fiscalRequired, noFiscalRequired };
}

export function sortFiscalOverviewItems(
  items: AdminFiscalOverviewItem[],
): AdminFiscalOverviewItem[] {
  return [...items].sort((a, b) => {
    const aAction = isFiscalActionNeeded(a) ? 0 : 1;
    const bAction = isFiscalActionNeeded(b) ? 0 : 1;
    if (aAction !== bAction) return aAction - bAction;

    const aName = (a.customerName ?? a.customerEmail ?? "").toLowerCase();
    const bName = (b.customerName ?? b.customerEmail ?? "").toLowerCase();
    return aName.localeCompare(bName, "de");
  });
}

export function matchesFiscalStatusFilter(
  row: AdminFiscalOverviewItem,
  filter: FiscalStatusFilter,
): boolean {
  if (filter === "all") return true;

  const ampel = deriveFiscalAmpel(row);
  switch (filter) {
    case "action_needed":
      return ampel.tone === "red" || ampel.tone === "yellow";
    case "setup_running":
      return ampel.tone === "yellow";
    case "ok":
      return ampel.tone === "green";
    case "no_country":
      return ampel.tone === "gray";
    default:
      return true;
  }
}

export function filterFiscalOverviewItems(
  items: AdminFiscalOverviewItem[],
  options: {
    search: string;
    statusFilter: FiscalStatusFilter;
    customerId?: string;
  },
): AdminFiscalOverviewItem[] {
  const term = options.search.trim().toLowerCase();

  return sortFiscalOverviewItems(
    items.filter((row) => {
      if (options.customerId && row.customerId !== options.customerId) {
        return false;
      }
      if (!matchesFiscalStatusFilter(row, options.statusFilter)) {
        return false;
      }
      if (!term) return true;

      const haystack = [
        row.customerName,
        row.customerEmail,
        row.country,
        row.provider,
        row.providerLabel,
        row.fiscalConfigurationLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    }),
  );
}

export function buildGroupHeaderStats(items: AdminFiscalOverviewItem[]): {
  customerCount: number;
  pendingCount: number;
  countries: string[];
  providers: string[];
  receiptModes: string[];
} {
  const countries = new Set<string>();
  const providers = new Set<string>();
  const receiptModes = new Set<string>();
  let pendingCount = 0;

  for (const row of items) {
    if (row.country) countries.add(row.country);
    if (row.provider) providers.add(row.provider);
    if (row.receiptMode) receiptModes.add(row.receiptMode);
    if (deriveFiscalAmpel(row).tone === "yellow") pendingCount += 1;
  }

  return {
    customerCount: items.length,
    pendingCount,
    countries: Array.from(countries).sort(),
    providers: Array.from(providers).sort(),
    receiptModes: Array.from(receiptModes).sort(),
  };
}

export function countryFlagEmoji(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "";
  const upper = code.toUpperCase();
  return [...upper]
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}
