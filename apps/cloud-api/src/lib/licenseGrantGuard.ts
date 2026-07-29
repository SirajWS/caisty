/**
 * Distinguish subscription-backed paid licenses from manual admin grants.
 *
 * Preferred rule (no schema migration):
 * - subscriptionId set → paid subscription license (may be extended by Stripe renewals)
 * - subscriptionId null → manual / non-subscription license (never touch in renewal/reconcile)
 */

export function isSubscriptionBackedPaidLicense(license: {
  subscriptionId?: string | null;
  plan?: string | null;
  status?: string | null;
}): boolean {
  const plan = String(license.plan ?? "")
    .trim()
    .toLowerCase();
  if (plan !== "starter" && plan !== "pro" && plan !== "business") return false;
  const status = String(license.status ?? "")
    .trim()
    .toLowerCase();
  if (status && status !== "active") return false;
  return Boolean(license.subscriptionId && String(license.subscriptionId).trim());
}

export function isManualOrNonSubscriptionLicense(license: {
  subscriptionId?: string | null;
}): boolean {
  return !license.subscriptionId || !String(license.subscriptionId).trim();
}

/** Never shorten license validity — renewals only extend forward. */
export function maxLicenseValidUntil(
  current: Date | string | null | undefined,
  periodEnd: Date,
): Date {
  const curMs = current ? new Date(current).getTime() : 0;
  const nextMs = periodEnd.getTime();
  return new Date(Math.max(Number.isFinite(curMs) ? curMs : 0, nextMs));
}

export type SubscriptionPaidLicenseAction = "extend" | "create" | "skip";

/**
 * Decide renewal/reconcile license action.
 * Manual licenses (subscriptionId null) never block create and are never "extended".
 */
export function resolveSubscriptionPaidLicenseAction(
  licenses: Array<{
    id?: string;
    subscriptionId?: string | null;
    plan?: string | null;
    status?: string | null;
  }>,
  subscriptionId: string,
): {
  action: SubscriptionPaidLicenseAction;
  targetLicenseId?: string;
} {
  const sid = String(subscriptionId).trim();
  const forThisSub = licenses.find(
    (lic) =>
      isSubscriptionBackedPaidLicense(lic) &&
      String(lic.subscriptionId).trim() === sid,
  );
  if (forThisSub) {
    return {
      action: "extend",
      targetLicenseId: forThisSub.id ? String(forThisSub.id) : undefined,
    };
  }

  const blockingOtherSubBacked = licenses.some(
    (lic) =>
      isSubscriptionBackedPaidLicense(lic) &&
      String(lic.subscriptionId).trim() !== sid,
  );
  if (blockingOtherSubBacked) {
    return { action: "skip" };
  }

  return { action: "create" };
}
