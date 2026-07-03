import type { AdminFiscalOverviewItem } from "../../lib/fiscalApi";
import { deriveFiscalAmpel } from "../../lib/fiscalComplianceView";
import { StatusPill, type StatusPillTone } from "./StatusPill";

function toneToPill(tone: "green" | "yellow" | "red" | "gray"): StatusPillTone {
  return tone === "yellow" ? "amber" : tone;
}

export function FiscalStatusPill({
  fiscal,
}: {
  fiscal: AdminFiscalOverviewItem | undefined;
}) {
  if (!fiscal) {
    return <StatusPill tone="gray" label="No country selected" />;
  }

  const ampel = deriveFiscalAmpel(fiscal);
  return <StatusPill tone={toneToPill(ampel.tone)} label={ampel.label} />;
}
