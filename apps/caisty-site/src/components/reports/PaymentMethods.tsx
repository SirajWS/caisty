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
  hint,
  dash,
}: {
  methods: PaymentMethodStat[];
  title: string;
  hint?: string;
  dash: string;
}) {
  return (
    <section className="dashboard-panel reports-payment-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="reports-payment-layout">
        <div className="reports-payment-summary">
          <div className="orders-payment-strip">
            {methods.map((card) => (
              <div key={card.id} className="orders-payment-strip-item">
                <span className="orders-payment-label">{card.label}</span>
                <span className={`orders-payment-value tabular-nums ${toneClass(card.tone)}`}>
                  {hint ? dash : card.value}
                </span>
              </div>
            ))}
          </div>
          {hint ? <p className="orders-payment-hint">{hint}</p> : null}
        </div>
        <div className="reports-pie-placeholder reports-pie-placeholder--muted" aria-hidden={false}>
          <div className="reports-pie-placeholder-ring">
            <PieChart size={24} strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </section>
  );
}
