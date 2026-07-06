import type { PortalCustomer, PortalLicense } from "../../lib/portalApi";
import type { PortalTranslations } from "../../lib/translations/portal";
import {
  portalCardShell,
  portalLicenseStatusBadge,
  portalPrimaryCta,
  portalSecondaryCta,
} from "../../lib/portalUi";

export function CurrentSubscription({
  customer,
  primaryLicense,
  loading,
  isLight,
  t,
  locale,
  paidPeriod,
  stripeEligible,
  busyBillingPortal,
  onManageSubscription,
}: {
  customer: PortalCustomer;
  primaryLicense: PortalLicense | null;
  loading: boolean;
  isLight: boolean;
  t: PortalTranslations;
  locale: string;
  paidPeriod: "monthly" | "yearly" | null | undefined;
  stripeEligible: boolean;
  busyBillingPortal: boolean;
  onManageSubscription: () => void;
}) {
  const c = t.billing.center;

  function formatDate(value: string | null | undefined): string {
    if (!value) return t.labels.dash;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return t.labels.dash;
    return d.toLocaleString(locale);
  }

  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{c.sectionSubscription}</h2>

      <div className={`${portalCardShell(isLight)} overflow-hidden !shadow-none !p-0 border-0`}>
        <div className="border-l-4 border-orange-500/45 pl-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div
              className={`text-xs font-semibold tracking-wide uppercase ${isLight ? "text-orange-600" : "text-orange-400"}`}
            >
              {t.plan.currentPlanLabel}
            </div>

            {loading ? (
              <div className="space-y-2">
                <div
                  className={`h-4 w-40 rounded animate-pulse ${isLight ? "bg-slate-200" : "bg-slate-800"}`}
                />
                <div
                  className={`h-3 w-24 rounded animate-pulse ${isLight ? "bg-slate-200" : "bg-slate-800"}`}
                />
              </div>
            ) : !primaryLicense ? (
              <div className={`text-xs ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                {t.plan.noActiveBody}
              </div>
            ) : (
              <>
                <div
                  className={`flex flex-wrap items-center gap-3 ${isLight ? "text-slate-900" : "text-slate-50"}`}
                >
                  <span className="text-2xl font-bold tracking-tight">
                    {primaryLicense.plan === "trial"
                      ? t.plan.trialTitle
                      : primaryLicense.plan === "starter"
                        ? "Starter"
                        : primaryLicense.plan === "pro"
                          ? "Pro"
                          : primaryLicense.plan}
                  </span>
                  <span className={portalLicenseStatusBadge(primaryLicense.status, isLight)}>
                    {primaryLicense.status}
                  </span>
                </div>
                <div className={`text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  {t.plan.licenseKeyLabel}{" "}
                  <span className="font-mono text-xs">{primaryLicense.key}</span>
                </div>
                <div className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {t.labels.validUntil}: {formatDate(primaryLicense.validUntil)}
                </div>
                {paidPeriod &&
                  (primaryLicense.plan === "starter" || primaryLicense.plan === "pro") && (
                    <div
                      className={`text-[11px] font-medium ${isLight ? "text-slate-600" : "text-slate-400"}`}
                    >
                      {paidPeriod === "yearly"
                        ? t.plan.billingYearlyActive
                        : t.plan.billingMonthlyActive}
                    </div>
                  )}
              </>
            )}
          </div>

          <div
            className={`mt-2 space-y-1 text-xs text-right md:mt-0 md:max-w-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}
          >
            <div>
              {t.plan.accountHolder} {customer.name}
            </div>
            <div className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>
              {t.plan.paymentNote}
            </div>
          </div>
        </div>
      </div>

      {stripeEligible && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            {t.plan.subscriptionSectionBody}
          </p>
          <button
            type="button"
            onClick={onManageSubscription}
            disabled={busyBillingPortal}
            className={`shrink-0 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              busyBillingPortal ? portalSecondaryCta(isLight) : portalPrimaryCta()
            }`}
          >
            {busyBillingPortal ? t.plan.manageSubscriptionBusy : t.plan.manageSubscription}
          </button>
        </div>
      )}
    </section>
  );
}
