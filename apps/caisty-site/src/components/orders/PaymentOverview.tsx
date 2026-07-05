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
}: {
  payments: PaymentMethodCard[];
  title: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="orders-payment-grid">
        {payments.map((card) => (
          <div key={card.id} className="orders-payment-card">
            <span className="orders-payment-label">{card.label}</span>
            <span className={`orders-payment-value ${toneClass(card.tone)}`}>{card.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
