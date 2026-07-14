import type { PosHubTone } from "../../lib/posHub/types";
import type { PaymentMethodCard } from "../../lib/orders/types";

function toneClass(tone: PosHubTone): string {
  if (tone === "ok") return "dashboard-icon--ok";
  if (tone === "attention") return "dashboard-icon--attention";
  if (tone === "action_required") return "dashboard-icon--action";
  return "dashboard-text-muted";
}

export function PaymentOverview({
  payments,
  title,
  hint,
}: {
  payments: PaymentMethodCard[];
  title: string;
  hint?: string;
}) {
  return (
    <section className="dashboard-panel orders-payment-summary">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="orders-payment-grid">
        {payments.map((card) => (
          <div key={card.id} className="orders-payment-card">
            <span className="orders-payment-label">{card.label}</span>
            <div className={`orders-payment-value tabular-nums ${toneClass(card.tone)}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>
      {hint ? <p className="orders-payment-hint">{hint}</p> : null}
    </section>
  );
}
