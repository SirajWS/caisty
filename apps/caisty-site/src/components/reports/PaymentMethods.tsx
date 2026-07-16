import { PaymentSummaryPair } from "../orders/PaymentSummaryPair";
import type { PaymentMethodCard } from "../../lib/orders/types";
import type { PaymentSummaryRevenueHeader } from "../../lib/portal/derivePaymentSummaryCards";

/** Thin Reports wrapper — same PaymentSummaryPair as Dashboard/Orders. */
export function PaymentMethods({
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
  return <PaymentSummaryPair pos={pos} online={online} />;
}
