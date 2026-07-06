import type { BillingField } from "../../lib/billing/types";
import { BillingInfoGrid } from "./BillingInfoGrid";

export function PaymentSection({
  fields,
  title,
}: {
  fields: BillingField[];
  title: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <BillingInfoGrid fields={fields} />
    </section>
  );
}
