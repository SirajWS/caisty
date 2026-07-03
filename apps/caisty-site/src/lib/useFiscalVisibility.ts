import { useMemo } from "react";
import type { PortalBusinessProfile } from "./portalApi";
import type { PortalTranslations } from "./translations/portal";

export type FiscalVisibilityInput = {
  fiscalRequired?: boolean | null;
  fiscalStatus?: string | null;
  country?: string | null;
};

export type FiscalVisibility = {
  fiscalRequired: boolean;
  fiscalStatus: string | null;
  country: string | null;
  /** True when fiscal UI blocks should render (from API `fiscalRequired`). */
  showFiscalUi: boolean;
  isPendingSetup: boolean;
  isActive: boolean;
};

export function deriveFiscalVisibility(
  input: FiscalVisibilityInput | null | undefined,
): FiscalVisibility {
  const fiscalRequired = input?.fiscalRequired === true;
  const fiscalStatus = input?.fiscalStatus?.trim()
    ? input.fiscalStatus.trim()
    : null;
  const country = input?.country?.trim() ? input.country.trim() : null;

  return {
    fiscalRequired,
    fiscalStatus,
    country,
    showFiscalUi: fiscalRequired,
    isPendingSetup: fiscalStatus === "pending_setup",
    isActive: fiscalStatus === "active",
  };
}

export function useFiscalVisibility(
  business: PortalBusinessProfile | null | undefined,
): FiscalVisibility {
  return useMemo(
    () =>
      deriveFiscalVisibility({
        fiscalRequired: business?.fiscalRequired,
        fiscalStatus: business?.fiscalStatus,
        country: business?.country,
      }),
    [business?.fiscalRequired, business?.fiscalStatus, business?.country],
  );
}

export type FiscalCustomerCopy = {
  badge: string;
  message: string;
  tone: "ok" | "unknown";
};

/** Customer-facing fiscal line — country-aware (TN vs DE). */
export function getFiscalCustomerCopy(
  t: PortalTranslations,
  visibility: FiscalVisibility,
): FiscalCustomerCopy | null {
  if (!visibility.country) return null;

  if (!visibility.fiscalRequired) {
    return {
      badge: t.fiscal.standardBadge,
      message: t.fiscal.standardReceiptsMessage,
      tone: "ok",
    };
  }

  if (visibility.isActive) {
    return {
      badge: t.fiscal.activeBadge,
      message: t.fiscal.activeMessage,
      tone: "ok",
    };
  }

  return {
    badge: t.fiscal.fiscalRequiredBadge,
    message: t.fiscal.fiscalRequiredMessage,
    tone: "unknown",
  };
}
