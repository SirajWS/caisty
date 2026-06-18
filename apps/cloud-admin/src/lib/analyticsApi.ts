import { apiGet } from "./api";

export type AnalyticsPreset =
  | "7d"
  | "30d"
  | "12m"
  | "ytd"
  | "all"
  | "custom";

export type AnalyticsOverview = {
  ok: boolean;
  preset: AnalyticsPreset;
  from: string;
  to: string;
  currency: string;
  totalRevenueCents: number;
  rangeRevenueCents: number;
  mrrCents: number;
  arrCents: number;
  activeCustomers: number;
  trialCustomersActive: number;
  trialCustomersEver: number;
  trialConverted: number;
  trialConversionRate: number;
  churn: { newCustomers: number; lostCustomers: number; net: number };
};

export type RevenueBucket = {
  periodStart: string;
  revenueCents: number;
  invoiceCount: number;
};

export type RevenueDrillInvoice = {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string;
  amountGrossCents: number;
  paidAt: string | null;
};

export type PlanBreakdownItem = {
  key: string;
  label: string;
  customerCount: number;
  revenueCents: number;
};

function qs(params: Record<string, string | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") s.set(k, v);
  }
  const str = s.toString();
  return str ? `?${str}` : "";
}

export function fetchAnalyticsOverview(
  preset: AnalyticsPreset,
  from?: string,
  to?: string,
): Promise<AnalyticsOverview> {
  return apiGet(
    `/admin/analytics/overview${qs({ preset, from, to })}`,
  );
}

export function fetchAnalyticsRevenue(
  preset: AnalyticsPreset,
  from?: string,
  to?: string,
  bucketStart?: string,
  bucketEnd?: string,
): Promise<{
  ok: boolean;
  buckets: RevenueBucket[];
  invoices?: RevenueDrillInvoice[];
  from: string;
  to: string;
}> {
  return apiGet(
    `/admin/analytics/revenue${qs({ preset, from, to, bucketStart, bucketEnd })}`,
  );
}

export function fetchAnalyticsPlans(
  preset: AnalyticsPreset,
  from?: string,
  to?: string,
): Promise<{ ok: boolean; plans: PlanBreakdownItem[] }> {
  return apiGet(`/admin/analytics/plans${qs({ preset, from, to })}`);
}

export function fetchAnalyticsCustomers(
  preset: AnalyticsPreset,
  from?: string,
  to?: string,
): Promise<{
  ok: boolean;
  buckets: Array<{
    periodStart: string;
    newCustomers: number;
    cumulativeTotal: number;
  }>;
}> {
  return apiGet(`/admin/analytics/customers${qs({ preset, from, to })}`);
}

export function fetchAnalyticsSubscriptions(
  preset: AnalyticsPreset,
  from?: string,
  to?: string,
): Promise<{
  ok: boolean;
  buckets: Array<{
    periodStart: string;
    newSubscriptions: number;
    cancelledSubscriptions: number;
    activeAtEnd: number;
  }>;
}> {
  return apiGet(
    `/admin/analytics/subscriptions${qs({ preset, from, to })}`,
  );
}
