import type {
  PortalBusinessProfile,
  PortalCustomer,
  PortalInvoice,
  PortalLicense,
} from "./portalApi";

export type SetupStepId =
  | "country_currency"
  | "company"
  | "license_plan"
  | "install";

export type SetupStep = {
  id: SetupStepId;
  done: boolean;
};

export type SetupStepperInput = {
  business: PortalBusinessProfile | null;
  licenses: PortalLicense[];
  customer?: PortalCustomer | null;
  invoices?: PortalInvoice[];
  deviceCount: number;
};

export type SetupStepperState = {
  steps: SetupStep[];
  currentStepId: SetupStepId | null;
  remainingCount: number;
  allDone: boolean;
};

export function isStepCountryCurrencyDone(
  business: PortalBusinessProfile | null,
): boolean {
  if (!business) return false;
  const country = (business.country ?? "").trim();
  const currency = (business.currency ?? "").trim();
  return country.length > 0 && currency.length > 0;
}

export function isStepCompanyDone(
  business: PortalBusinessProfile | null,
): boolean {
  if (!business) return false;
  return business.complianceStatus === "ready";
}

export function isStepLicensePlanDone(
  licenses: PortalLicense[],
  customer?: PortalCustomer | null,
  invoices: PortalInvoice[] = [],
): boolean {
  const hasActiveLicense = licenses.some(
    (l) => (l.status ?? "").toLowerCase() === "active",
  );
  if (hasActiveLicense) return true;

  const primary = customer?.primaryLicense;
  if (primary && (primary.status ?? "").toLowerCase() === "active") {
    return true;
  }

  if (customer?.stripeBillingPortalEligible) return true;
  if (customer?.paidBillingPeriod) return true;

  const hasPendingPlan = invoices.some(
    (inv) =>
      (inv.status ?? "").toLowerCase() === "open" &&
      Boolean((inv.plan ?? "").trim()),
  );
  if (hasPendingPlan) return true;

  return false;
}

export function isStepInstallDone(deviceCount: number): boolean {
  return deviceCount >= 1;
}

export function derivePortalSetupSteps(
  input: SetupStepperInput,
): SetupStepperState {
  const steps: SetupStep[] = [
    {
      id: "country_currency",
      done: isStepCountryCurrencyDone(input.business),
    },
    {
      id: "company",
      done: isStepCompanyDone(input.business),
    },
    {
      id: "license_plan",
      done: isStepLicensePlanDone(
        input.licenses,
        input.customer,
        input.invoices ?? [],
      ),
    },
    {
      id: "install",
      done: isStepInstallDone(input.deviceCount),
    },
  ];

  const remainingCount = steps.filter((s) => !s.done).length;
  const currentStepId = steps.find((s) => !s.done)?.id ?? null;

  return {
    steps,
    currentStepId,
    remainingCount,
    allDone: remainingCount === 0,
  };
}

export function setupStepHref(stepId: SetupStepId): string {
  switch (stepId) {
    case "country_currency":
    case "company":
      return "/portal/business";
    case "license_plan":
      return "/portal/billing";
    case "install":
      return "/portal/install";
    default:
      return "/portal";
  }
}
