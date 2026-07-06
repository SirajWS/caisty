import { PieChart } from "lucide-react";
import type { PosHubTone } from "../../lib/posHub/types";
import type { PaymentMethodStat } from "../../lib/reports/types";

function toneClass(tone: PosHubTone): string {
  if (tone === "ok") return "dashboard-icon--ok";
  if (tone === "attention") return "dashboard-icon--attention";
  if (tone === "action_required") return "dashboard-icon--action";
  return "dashboard-text-muted";
}

export function PaymentMethods({
  methods,
  title,
  chartPlaceholder,
}: {
  methods: PaymentMethodStat[];
  title: string;
  chartPlaceholder: string;
}) {
  return (
    <section className="dashboard-panel reports-payment-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="reports-payment-layout">
        <div className="reports-payment-cards">
          {methods.map((card) => (
            <div key={card.id} className="reports-stat-card">
              <span className="reports-stat-label">{card.label}</span>
              <span className={`reports-stat-value ${toneClass(card.tone)}`}>{card.value}</span>
            </div>
          ))}
        </div>
        <div className="reports-pie-placeholder" aria-hidden={false}>
          <div className="reports-pie-placeholder-ring">
            <PieChart size={24} strokeWidth={1.5} />
          </div>
          <p className="reports-chart-placeholder-text reports-chart-placeholder-text--compact">
            {chartPlaceholder}
          </p>
        </div>
      </div>
    </section>
  );
}
