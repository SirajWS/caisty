import { PaymentOverview } from "./PaymentOverview";
import type { PaymentMethodCard } from "../../lib/orders/types";
import type { PaymentSummaryRevenueHeader } from "../../lib/portal/derivePaymentSummaryCards";

export function PaymentSummaryPair({
  pos,
  online,
}: {
  pos: {
    payments: PaymentMethodCard[];
    title: string;
    hint?: string;
  };
  online: {
    payments: PaymentMethodCard[];
    title: string;
    hint?: string;
    infoHint?: string;
    revenueHeader?: PaymentSummaryRevenueHeader;
  };
}) {
  return (
    <div className="orders-payment-summary-row">
      <PaymentOverview {...pos} compact />
      <PaymentOverview {...online} compact />
    </div>
  );
}
