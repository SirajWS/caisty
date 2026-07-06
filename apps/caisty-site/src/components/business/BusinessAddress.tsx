import { MapPin } from "lucide-react";
import type { BusinessField } from "../../lib/business/types";
import { BusinessInfoGrid } from "./BusinessInfoGrid";

export function BusinessAddress({
  fields,
  title,
  mapLabel,
}: {
  fields: BusinessField[];
  title: string;
  mapLabel: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <BusinessInfoGrid fields={fields} />
      <div className="business-map-placeholder">
        <MapPin size={20} className="dashboard-icon--muted" aria-hidden />
        <span>{mapLabel}</span>
      </div>
    </section>
  );
}
