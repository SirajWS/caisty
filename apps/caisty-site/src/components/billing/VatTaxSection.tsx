import type { BillingField } from "../../lib/billing/types";
import { BillingInfoGrid } from "./BillingInfoGrid";

export function VatTaxSection({
  fields,
  title,
  loading,
}: {
  fields: BillingField[];
  title: string;
  loading: boolean;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      {loading ? (
        <p className="dashboard-text-muted text-xs">{fields[0]?.value}</p>
      ) : (
        <BillingInfoGrid fields={fields} />
      )}
    </section>
  );
}
