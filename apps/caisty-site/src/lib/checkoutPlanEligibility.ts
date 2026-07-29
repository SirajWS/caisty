/** Mirrors `apps/cloud-api/src/lib/checkoutPlanEligibility.ts` for portal UI. */

export type PaidPlanTier = "starter" | "pro" | "business";

export type PaidPlanContext = {
  tier: PaidPlanTier;
  period: "monthly" | "yearly" | null;
};

export type CheckoutBlockCode =
  | "already_have_plan"
  | "downgrade_not_allowed"
  | "interval_downgrade_not_allowed"
  | "period_not_available";

export type CheckoutEligibility =
  | { ok: true }
  | { ok: false; code: CheckoutBlockCode };

const TIER_RANK: Record<PaidPlanTier, number> = {
  starter: 1,
  pro: 2,
  business: 3,
};

export function evaluateCheckoutEligibility(
  active: PaidPlanContext | null,
  targetTier: PaidPlanTier,
  targetPeriod: "monthly" | "yearly",
  options?: { yearlyAvailable?: boolean },
): CheckoutEligibility {
  const yearlyAvailable = options?.yearlyAvailable ?? true;
  if (targetPeriod === "yearly" && !yearlyAvailable) {
    return { ok: false, code: "period_not_available" };
  }

  if (!active) return { ok: true };

  if (TIER_RANK[targetTier] < TIER_RANK[active.tier]) {
    return { ok: false, code: "downgrade_not_allowed" };
  }

  if (TIER_RANK[targetTier] > TIER_RANK[active.tier]) {
    return { ok: true };
  }

  const ap = active.period;
  if (ap === null) {
    if (targetPeriod === "monthly") {
      return { ok: false, code: "already_have_plan" };
    }
    return { ok: true };
  }

  if (ap === targetPeriod) {
    return { ok: false, code: "already_have_plan" };
  }
  if (ap === "monthly" && targetPeriod === "yearly") {
    return { ok: true };
  }
  return { ok: false, code: "interval_downgrade_not_allowed" };
}
