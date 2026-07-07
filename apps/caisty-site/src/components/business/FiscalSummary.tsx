import type { BusinessField } from "../../lib/business/types";

export function FiscalSummary({
  fields,
  title,
}: {
  fields: BusinessField[];
  title: string;
}) {
  if (fields.length === 0) return null;

  return (
    <section className="dashboard-panel dashboard-panel--wide business-fiscal-summary">
      <h2 className="dashboard-panel-title business-fiscal-summary-title">{title}</h2>
      <dl className="business-fiscal-summary-grid">
        {fields.map((row) => (
          <div key={row.id} className="business-fiscal-summary-item">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
