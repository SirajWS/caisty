import { formatMinorUnits } from "../money/formatMinorUnits";
import type {
  PortalOnlinePaymentSummary,
  PortalOrdersPaymentSummary,
} from "../portalApi";
import type { PaymentMethodCard } from "../orders/types";
import type { PosHubTone } from "../posHub/types";

export type PaymentSummaryRevenueHeader = {
  label: string;
  value: string;
  subtitle: string;
};

function formatMoney(minor: number, currency: string, locale: string): string {
  return formatMinorUnits(minor, currency, locale);
}

export function deriveOnlineRevenueHeader(input: {
  onlineRevenueCents: number;
  currency: string;
  labels: {
    kpiOnlineRevenue: string;
    kpiOnlineRevenueInfo: string;
  };
  locale: string;
  dash: string;
  hasData: boolean;
}): PaymentSummaryRevenueHeader {
  return {
    label: input.labels.kpiOnlineRevenue,
    value: input.hasData
      ? formatMoney(input.onlineRevenueCents, input.currency, input.locale)
      : input.dash,
    subtitle: input.labels.kpiOnlineRevenueInfo,
  };
}

function card(
  id: string,
  label: string,
  cents: number,
  currency: string,
  locale: string,
  dash: string,
  hasData: boolean,
  emphasis = false,
): PaymentMethodCard {
  const tone: PosHubTone = hasData && cents > 0 ? "ok" : "unknown";
  return {
    id,
    label,
    value: hasData ? formatMoney(cents, currency, locale) : dash,
    tone,
    emphasis,
  };
}

export function derivePosPaymentCards(input: {
  summary: PortalOrdersPaymentSummary | null | undefined;
  labels: {
    paymentCash: string;
    paymentCard: string;
    paymentVoucher: string;
    paymentOther: string;
  };
  locale: string;
  dash: string;
  hasData: boolean;
}): PaymentMethodCard[] {
  const { summary, labels, locale, dash, hasData } = input;
  const currency = summary?.currency || "EUR";

  return [
    card("cash", labels.paymentCash, summary?.cashCents ?? 0, currency, locale, dash, hasData),
    card("card", labels.paymentCard, summary?.cardCents ?? 0, currency, locale, dash, hasData),
    card("voucher", labels.paymentVoucher, summary?.voucherCents ?? 0, currency, locale, dash, hasData),
    card("other", labels.paymentOther, summary?.otherCents ?? 0, currency, locale, dash, hasData),
  ];
}

export function deriveOnlinePaymentCards(input: {
  summary: PortalOnlinePaymentSummary | null | undefined;
  labels: {
    onlineCashPaid: string;
    onlineCardPaid: string;
    onlinePaidOnline: string;
    onlinePending: string;
    onlinePaidTotal: string;
  };
  locale: string;
  dash: string;
  hasData: boolean;
}): PaymentMethodCard[] {
  const { summary, labels, locale, dash, hasData } = input;
  const currency = summary?.currency || "EUR";
  const cashPaidCents = summary?.cashPaidCents ?? 0;
  const cardPaidCents = summary?.cardPaidCents ?? 0;
  const onlinePaidCents = summary?.onlinePaidCents ?? 0;
  const paidTotalCents = cashPaidCents + cardPaidCents + onlinePaidCents;

  return [
    card("cash_paid", labels.onlineCashPaid, cashPaidCents, currency, locale, dash, hasData),
    card("card_paid", labels.onlineCardPaid, cardPaidCents, currency, locale, dash, hasData),
    card("online_paid", labels.onlinePaidOnline, onlinePaidCents, currency, locale, dash, hasData),
    card("pending", labels.onlinePending, summary?.pendingCents ?? 0, currency, locale, dash, hasData),
    card(
      "paid_total",
      labels.onlinePaidTotal,
      paidTotalCents,
      currency,
      locale,
      dash,
      hasData,
      true,
    ),
  ];
}
