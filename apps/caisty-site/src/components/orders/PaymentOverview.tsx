import type { PosHubTone } from "../../lib/posHub/types";
import type { PaymentMethodCard } from "../../lib/orders/types";
import type { PaymentSummaryRevenueHeader } from "../../lib/portal/derivePaymentSummaryCards";

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
  infoHint,
  revenueHeader,
  compact = false,
}: {
  payments: PaymentMethodCard[];
  title: string;
  hint?: string;
  infoHint?: string;
  revenueHeader?: PaymentSummaryRevenueHeader;
  compact?: boolean;
}) {
  return (
    <section
      className={`dashboard-panel orders-payment-summary${compact ? " orders-payment-summary--compact" : ""}`}
    >
      <h2 className="dashboard-panel-title">{title}</h2>
      {revenueHeader ? (
        <div className="orders-payment-revenue-header">
          <span className="orders-payment-label">{revenueHeader.label}</span>
          <div className="orders-payment-revenue-value tabular-nums">{revenueHeader.value}</div>
          <span className="dashboard-kpi-subtitle">{revenueHeader.subtitle}</span>
        </div>
      ) : null}
      <div className="orders-payment-grid">
        {payments.map((card) => (
          <div
            key={card.id}
            className={`orders-payment-card${card.emphasis ? " orders-payment-card--emphasis" : ""}`}
          >
            <span className="orders-payment-label">{card.label}</span>
            <div className={`orders-payment-value tabular-nums ${toneClass(card.tone)}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>
      {hint ? <p className="orders-payment-hint">{hint}</p> : null}
      {infoHint ? <p className="orders-payment-info-hint">{infoHint}</p> : null}
    </section>
  );
}
