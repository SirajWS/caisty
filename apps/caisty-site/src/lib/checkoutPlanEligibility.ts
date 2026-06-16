/** Mirrors `apps/cloud-api/src/lib/checkoutPlanEligibility.ts` for portal UI. */

export type PaidPlanContext = {
  tier: "starter" | "pro";
  period: "monthly" | "yearly" | null;
};

export type CheckoutBlockCode =
  | "already_have_plan"
  | "downgrade_not_allowed"
  | "interval_downgrade_not_allowed";

export type CheckoutEligibility =
  | { ok: true }
  | { ok: false; code: CheckoutBlockCode };

export function evaluateCheckoutEligibility(
  active: PaidPlanContext | null,
  targetTier: "starter" | "pro",
  targetPeriod: "monthly" | "yearly",
): CheckoutEligibility {
  if (!active) return { ok: true };

  if (active.tier === "pro" && targetTier === "starter") {
    return { ok: false, code: "downgrade_not_allowed" };
  }

  if (active.tier === "starter" && targetTier === "pro") {
    return { ok: true };
  }

  if (active.tier !== targetTier) {
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
