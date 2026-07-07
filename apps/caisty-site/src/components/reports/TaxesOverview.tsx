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
  hint,
  dash,
}: {
  taxes: TaxCard[];
  title: string;
  hint?: string;
  dash: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="reports-tax-grid">
        {taxes.map((card) => (
          <div key={card.id} className="reports-stat-card">
            <span className="reports-stat-label">{card.label}</span>
            <span className={`reports-stat-value tabular-nums ${toneClass(card.tone)}`}>
              {hint ? dash : card.value}
            </span>
          </div>
        ))}
      </div>
      {hint ? <p className="reports-section-hint">{hint}</p> : null}
    </section>
  );
}
