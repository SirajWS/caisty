import type { PortalLicense } from "./portalApi";

/**
 * Prefer an active license; if none, the license with the latest validUntil
 * (same rule as the portal dashboard).
 */
export function pickPrimaryPortalLicense(
  licenses: PortalLicense[],
): PortalLicense | null {
  if (!licenses.length) return null;

  const actives = licenses.filter(
    (l) => (l.status ?? "").toLowerCase() === "active",
  );
  const pool = actives.length ? actives : licenses;
  const sorted = [...pool].sort((a, b) => {
    const ta = a.validUntil ? new Date(a.validUntil).getTime() : 0;
    const tb = b.validUntil ? new Date(b.validUntil).getTime() : 0;
    return tb - ta;
  });

  return sorted[0] ?? null;
}

/**
 * Active paid tier from portal licenses: Pro wins if both exist and are usable.
 * Matches cloud-api `getActivePaidLicenseTierForCustomer` rules (non-expired, active).
 */
export function getActivePaidPlanTier(
  licenses: PortalLicense[],
): "starter" | "pro" | null {
  const now = Date.now();
  const usable = (l: PortalLicense) => {
    if ((l.status ?? "").toLowerCase() !== "active") return false;
    if (!l.validUntil) return true;
    return new Date(l.validUntil).getTime() > now;
  };
  const paid = licenses.filter((l) => {
    const p = (l.plan ?? "").toLowerCase();
    return (p === "starter" || p === "pro") && usable(l);
  });
  if (paid.some((l) => (l.plan ?? "").toLowerCase() === "pro")) return "pro";
  if (paid.some((l) => (l.plan ?? "").toLowerCase() === "starter")) return "starter";
  return null;
}
