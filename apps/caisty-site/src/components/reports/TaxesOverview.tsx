import type { PosHubTone } from "../../lib/posHub/types";
import type { TaxCard } from "../../lib/reports/types";

function toneClass(tone: PosHubTone): string {
  if (tone === "ok") return "dashboard-icon--ok";
  if (tone === "attention") return "dashboard-icon--attention";
  if (tone === "action_required") return "dashboard-icon--action";
  return "dashboard-text-muted";
}

export function TaxesOverview({
  taxes,
  title,
}: {
  taxes: TaxCard[];
  title: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="reports-tax-grid">
        {taxes.map((card) => (
          <div key={card.id} className="reports-stat-card">
            <span className="reports-stat-label">{card.label}</span>
            <span className={`reports-stat-value ${toneClass(card.tone)}`}>{card.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
