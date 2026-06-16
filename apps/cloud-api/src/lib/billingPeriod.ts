export type BillingPeriod = "monthly" | "yearly";

export function parseBillingPeriodFromPlanId(
  planId: string | null | undefined,
): BillingPeriod {
  if (planId && planId.toLowerCase().includes("yearly")) return "yearly";
  return "monthly";
}

export function formatPlanTierLabel(plan: string | null | undefined): string {
  const raw = String(plan ?? "").trim().toLowerCase();
  if (raw === "starter") return "Starter";
  if (raw === "pro") return "Pro";
  if (!raw) return "—";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatPlanWithPeriodLabel(
  plan: string | null | undefined,
  period: BillingPeriod | null | undefined,
): string {
  const tier = formatPlanTierLabel(plan);
  if (!period) return tier;
  return `${tier} ${period === "yearly" ? "Yearly" : "Monthly"}`;
}

export function formatBillingPeriodLabel(
  period: BillingPeriod | null | undefined,
  locale: "de" | "en" = "de",
): string {
  if (!period) return "—";
  if (locale === "de") {
    return period === "yearly" ? "Jährlich" : "Monatlich";
  }
  return period === "yearly" ? "Yearly" : "Monthly";
}

export function billingPeriodLineItemSuffix(
  period: BillingPeriod | null | undefined,
): string {
  if (period === "yearly") return "Jährliche Abrechnung";
  return "Monatliche Abrechnung";
}
