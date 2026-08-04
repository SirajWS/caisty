// Zentrale Definition der License-Pläne – wird u.a. vom Verify-Endpoint benutzt.

export type LicensePlanId = "trial" | "starter" | "pro" | "business";

export interface LicensePlanConfig {
  id: LicensePlanId;
  label: string;
  description: string;
  /** Positive integer = hard cap. null reserved for future enterprise overrides — not used by standard plans. */
  maxDevices: number | null;
}

export const LICENSE_PLANS: Record<LicensePlanId, LicensePlanConfig> = {
  trial: {
    id: "trial",
    label: "Trial",
    description: "3 Tage Test mit 1 POS-Gerät",
    maxDevices: 1,
  },
  starter: {
    id: "starter",
    label: "Starter",
    description: "Plan für eine Filiale mit 1 POS-Gerät",
    maxDevices: 1,
  },
  pro: {
    id: "pro",
    label: "Pro",
    description: "Plan für bis zu 3 aktive POS-Geräte",
    maxDevices: 3,
  },
  business: {
    id: "business",
    label: "Business",
    description: "Plan für bis zu 5 aktive POS-Geräte in derselben Organisation",
    maxDevices: 5,
  },
} as const;

export function isLicensePlanId(plan: string): plan is LicensePlanId {
  return plan in LICENSE_PLANS;
}

/** Resolve maxDevices for a plan key. Unknown plans fall back to 1 (never invent unlimited). */
export function maxDevicesForPlan(plan: string): number | null {
  if (isLicensePlanId(plan)) {
    return LICENSE_PLANS[plan].maxDevices;
  }
  return 1;
}
