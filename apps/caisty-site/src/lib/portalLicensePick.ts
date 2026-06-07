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
