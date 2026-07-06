import React from "react";
import {
  createTrialLicense,
  type PortalLicense,
} from "../../lib/portalApi";
import { PRICING, TRIAL_DAYS, CURRENCY_SYMBOLS, type Currency } from "../../config/pricing";
import type { PortalTranslations } from "../../lib/translations/portal";
import {
  evaluateCheckoutEligibility,
  type PaidPlanContext,
} from "../../lib/checkoutPlanEligibility";
import { getActivePaidPlanTier } from "../../lib/portalLicensePick";
import {
  portalCardShell,
  portalPrimaryCta,
  portalSecondaryCta,
} from "../../lib/portalUi";

type BillingPeriod = "monthly" | "yearly";

export function BillingPlansPanel({
  licenses,
  setLicenses,
  loading,
  isLight,
  t,
  currency,
  paidPeriod,
  onError,
}: {
  licenses: PortalLicense[];
  setLicenses: React.Dispatch<React.SetStateAction<PortalLicense[]>>;
  loading: boolean;
  isLight: boolean;
  t: PortalTranslations;
  currency: Currency;
  paidPeriod: "monthly" | "yearly" | null | undefined;
  onError: (message: string | null) => void;
}) {
  const c = t.billing.center;
  const [billingPeriod, setBillingPeriod] = React.useState<BillingPeriod>("monthly");
  const [busyTrial, setBusyTrial] = React.useState(false);
  const [busyPlan, setBusyPlan] = React.useState<"starter" | "pro" | null>(null);

  const priceDecimals = billingPeriod === "yearly" ? 0 : 2;
  const starterPrice = PRICING[currency].starter[billingPeriod];
  const proPrice = PRICING[currency].pro[billingPeriod];
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const planPeriodLabel =
    billingPeriod === "yearly"
      ? currency === "EUR"
        ? t.labels.perYearInclVat
        : t.labels.perYear
      : currency === "EUR"
        ? t.labels.perMonthInclVat
        : t.labels.perMonth;

  const activePaidPlan = React.useMemo(() => getActivePaidPlanTier(licenses), [licenses]);
  const hasTrialLicense = React.useMemo(
    () => licenses.some((l) => l.plan === "trial"),
    [licenses],
  );

  const activeCheckoutCtx = React.useMemo<PaidPlanContext | null>(
    () => (activePaidPlan ? { tier: activePaidPlan, period: paidPeriod ?? null } : null),
    [activePaidPlan, paidPeriod],
  );

  const starterCheckoutElig = React.useMemo(
    () => evaluateCheckoutEligibility(activeCheckoutCtx, "starter", billingPeriod),
    [activeCheckoutCtx, billingPeriod],
  );

  const proCheckoutElig = React.useMemo(
    () => evaluateCheckoutEligibility(activeCheckoutCtx, "pro", billingPeriod),
    [activeCheckoutCtx, billingPeriod],
  );

  const proBlockedYearlyStarterRule =
    activeCheckoutCtx?.tier === "starter" &&
    activeCheckoutCtx.period === "yearly" &&
    billingPeriod === "monthly";

  const starterPlanDisabled = loading || !starterCheckoutElig.ok;
  const proPlanDisabled = loading || !proCheckoutElig.ok || proBlockedYearlyStarterRule;

  function starterPlanCtaText(): string {
    if (busyPlan === "starter") return t.plan.starterBtnBusy;
    if (!starterCheckoutElig.ok) {
      if (starterCheckoutElig.code === "already_have_plan") return t.plan.planCtaCurrent;
      if (starterCheckoutElig.code === "interval_downgrade_not_allowed")
        return t.plan.planCtaYearlyBillingOnly;
      return t.plan.planCtaDowngradeNotAvailable;
    }
    if (
      activeCheckoutCtx?.tier === "starter" &&
      activeCheckoutCtx.period === "monthly" &&
      billingPeriod === "yearly"
    ) {
      return t.plan.planCtaSwitchToYearly;
    }
    return t.plan.planCtaChoose;
  }

  function proPlanCtaText(): string {
    if (busyPlan === "pro") return t.plan.starterBtnBusy;
    if (proBlockedYearlyStarterRule) return t.plan.planCtaProYearlyOnly;
    if (!proCheckoutElig.ok) {
      if (proCheckoutElig.code === "already_have_plan") return t.plan.planCtaCurrent;
      if (proCheckoutElig.code === "interval_downgrade_not_allowed")
        return t.plan.planCtaYearlyBillingOnly;
      return t.plan.planCtaDowngradeNotAvailable;
    }
    if (activeCheckoutCtx?.tier === "starter") return t.plan.planCtaUpgradePro;
    if (
      activeCheckoutCtx?.tier === "pro" &&
      activeCheckoutCtx.period === "monthly" &&
      billingPeriod === "yearly"
    ) {
      return t.plan.planCtaSwitchToYearly;
    }
    return t.plan.planCtaChoose;
  }

  async function handleCreateTrial() {
    try {
      onError(null);
      setBusyTrial(true);
      const lic = await createTrialLicense();
      setLicenses((prev) => [lic, ...prev]);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : t.plan.trialCreateError);
    } finally {
      setBusyTrial(false);
    }
  }

  async function handleUpgradePlan(plan: "starter" | "pro") {
    try {
      onError(null);
      setBusyPlan(plan);
      const planId = `${plan}_${billingPeriod}`;
      window.location.href = `/portal/checkout?plan=${encodeURIComponent(planId)}`;
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : t.plan.upgradeError);
    } finally {
      setBusyPlan(null);
    }
  }

  const trialDaysLabel = t.plan.trialPriceSuffix.replace("{{days}}", String(TRIAL_DAYS));

  return (
    <section id="billing-plans" className="dashboard-panel scroll-mt-20 space-y-6">
      <h2 className="dashboard-panel-title">{c.sectionPlans}</h2>
      {activePaidPlan && (
        <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
          {t.plan.overviewPaidPlanLine.replace(
            "{{plan}}",
            activePaidPlan === "starter" ? "Starter" : "Pro",
          )}
        </p>
      )}

      <div
        className={`flex flex-col gap-3 rounded-xl border px-3 py-3 sm:flex-row sm:items-center sm:justify-between ${
          isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-900/35"
        }`}
        role="group"
        aria-label={t.plan.billingIntervalLabel}
      >
        <span
          className={`text-xs font-semibold tracking-wide uppercase ${isLight ? "text-slate-600" : "text-slate-400"}`}
        >
          {t.plan.billingIntervalLabel}
        </span>
        <div
          className={`inline-flex self-start rounded-full p-0.5 sm:self-auto ${
            isLight ? "bg-slate-200/80" : "bg-slate-800/80"
          }`}
        >
          <button
            type="button"
            aria-pressed={billingPeriod === "monthly"}
            onClick={() => setBillingPeriod("monthly")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              billingPeriod === "monthly"
                ? isLight
                  ? "bg-white text-slate-900 shadow-sm"
                  : "bg-orange-500 text-white"
                : isLight
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.labels.monthly}
          </button>
          <button
            type="button"
            aria-pressed={billingPeriod === "yearly"}
            onClick={() => setBillingPeriod("yearly")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              billingPeriod === "yearly"
                ? isLight
                  ? "bg-white text-slate-900 shadow-sm"
                  : "bg-orange-500 text-white"
                : isLight
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.labels.yearly}
          </button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className={`flex flex-col justify-between ${portalCardShell(isLight)}`}>
          <div className="space-y-2">
            <div className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-50"}`}>
              {t.plan.trialTitle}
            </div>
            <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              {t.plan.trialDesc}
            </p>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              <span
                className={`text-3xl font-bold tabular-nums tracking-tight ${
                  isLight ? "text-orange-600" : "text-orange-400"
                }`}
              >
                0
              </span>
              <span className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                {currencySymbol}
              </span>
              <span className={`w-full text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                {trialDaysLabel}
              </span>
            </div>
            <div className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {t.plan.trialDeviceNote}
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleCreateTrial}
              disabled={busyTrial || hasTrialLicense}
              className={`w-full ${hasTrialLicense || busyTrial ? portalSecondaryCta(isLight) : portalPrimaryCta()}`}
            >
              {hasTrialLicense
                ? t.plan.trialBtnUsed
                : busyTrial
                  ? t.plan.trialBtnBusy
                  : t.plan.trialBtn}
            </button>
            <p className={`mt-2 text-[11px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>
              {t.plan.trialHint}
            </p>
          </div>
        </div>

        <div
          className={`relative flex flex-col justify-between ${portalCardShell(isLight)} !border-2 !border-orange-500`}
        >
          <span
            className={`absolute right-4 top-4 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              isLight ? "bg-orange-500 text-white" : "bg-orange-500 text-white"
            }`}
          >
            {t.labels.recommended}
          </span>
          <div className="space-y-2 pr-14 pt-1">
            <div className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-50"}`}>
              Starter
            </div>
            <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              {t.plan.starterDesc}
            </p>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
              <span
                className={`text-3xl font-bold tabular-nums tracking-tight ${
                  isLight ? "text-orange-600" : "text-orange-400"
                }`}
              >
                {starterPrice.toFixed(priceDecimals)}
              </span>
              <span className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                {currencySymbol}
              </span>
            </div>
            <div className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {planPeriodLabel}
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => handleUpgradePlan("starter")}
              disabled={busyPlan === "starter" || starterPlanDisabled}
              className={`w-full ${
                busyPlan === "starter" || starterPlanDisabled
                  ? portalSecondaryCta(isLight)
                  : portalPrimaryCta()
              }`}
            >
              {starterPlanCtaText()}
            </button>
            <p className={`mt-2 text-[11px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>
              {t.plan.purchaseHint}
            </p>
          </div>
        </div>

        <div className={`flex flex-col justify-between ${portalCardShell(isLight)}`}>
          <div className="space-y-2">
            <div className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-50"}`}>
              Pro
            </div>
            <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              {t.plan.proDesc}
            </p>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
              <span
                className={`text-3xl font-bold tabular-nums tracking-tight ${
                  isLight ? "text-orange-600" : "text-orange-400"
                }`}
              >
                {proPrice.toFixed(priceDecimals)}
              </span>
              <span className={`text-sm font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                {currencySymbol}
              </span>
            </div>
            <div className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {planPeriodLabel}
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => handleUpgradePlan("pro")}
              disabled={busyPlan === "pro" || proPlanDisabled}
              className={`w-full ${
                busyPlan === "pro" || proPlanDisabled
                  ? portalSecondaryCta(isLight)
                  : portalPrimaryCta()
              }`}
            >
              {proPlanCtaText()}
            </button>
            <p className={`mt-2 text-[11px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>
              {t.plan.purchaseHint}
            </p>
          </div>
        </div>

        <div className={`flex flex-col justify-between ${portalCardShell(isLight)} opacity-85`}>
          <div className="space-y-2">
            <div className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-50"}`}>
              Enterprise
            </div>
            <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              {c.enterpriseDesc}
            </p>
          </div>
          <div className="mt-4">
            <span className="dashboard-quick-btn dashboard-quick-btn--disabled w-full justify-center" aria-disabled>
              {c.comingSoon}
            </span>
          </div>
        </div>
      </div>

      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-500"}`}>{t.plan.vatFootnote}</p>
    </section>
  );
}
