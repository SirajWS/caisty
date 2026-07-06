import type { BusinessField } from "../../lib/business/types";
import { BusinessInfoGrid } from "./BusinessInfoGrid";

export function CompanyInformation({
  fields,
  title,
}: {
  fields: BusinessField[];
  title: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <BusinessInfoGrid fields={fields} />
    </section>
  );
}
