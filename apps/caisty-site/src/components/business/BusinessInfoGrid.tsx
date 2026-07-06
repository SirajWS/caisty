import type { BusinessField } from "../../lib/business/types";

export function BusinessInfoGrid({ fields }: { fields: BusinessField[] }) {
  return (
    <dl className="business-info-grid">
      {fields.map((row) => (
        <div key={row.id} className="business-info-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
