// apps/api/src/config/licensePlans.ts
// Zentrale Definition der License-Pläne – wird u.a. vom Verify-Endpoint benutzt.

export type LicensePlanId = "trial" | "starter" | "pro";

export interface LicensePlanConfig {
  id: LicensePlanId;
  label: string;
  description: string;
  maxDevices: number;
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
} as const;
