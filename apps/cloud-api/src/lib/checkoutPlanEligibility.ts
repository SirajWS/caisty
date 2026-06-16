/**
 * Portal checkout rules: same paid tier + same billing period = no new checkout;
 * monthly → yearly on same tier allowed; yearly → monthly on same tier blocked;
 * Pro → Starter blocked.
 */

export type PaidPlanContext = {
  tier: "starter" | "pro";
  /** `null` = unknown (no matching subscription row to infer); treat conservatively in UI. */
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
