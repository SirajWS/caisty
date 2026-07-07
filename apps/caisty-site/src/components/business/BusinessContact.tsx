import type { BusinessField } from "../../lib/business/types";
import { BusinessInfoGrid } from "./BusinessInfoGrid";

export function BusinessContact({
  fields,
  title,
  comingSoonNote,
}: {
  fields: BusinessField[];
  title: string;
  comingSoonNote: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <BusinessInfoGrid fields={fields} />
      <p className="dashboard-text-muted text-xs mt-3 mb-0">{comingSoonNote}</p>
    </section>
  );
}
