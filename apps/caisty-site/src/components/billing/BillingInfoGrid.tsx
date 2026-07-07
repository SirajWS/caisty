import type { BillingField } from "../../lib/billing/types";

export function BillingInfoGrid({ fields }: { fields: BillingField[] }) {
  return (
    <dl className="billing-info-grid">
      {fields.map((row) => (
        <div key={row.id} className="billing-info-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
