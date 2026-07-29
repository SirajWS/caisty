import React from "react";
import { Check } from "lucide-react";
import {
  createTrialLicense,
  type PortalLicense,
} from "../../lib/portalApi";
import {
  CURRENCY_SYMBOLS,
  resolvePlanPrice,
  isYearlyPlanAvailable,
  type Currency,
  type PaidPlanKey,
} from "../../config/pricing";
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
  const [busyPlan, setBusyPlan] = React.useState<PaidPlanKey | null>(null);
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const planPeriodLabelFor = (period: BillingPeriod, displayCurrency: Currency = currency) =>
    period === "yearly"
      ? displayCurrency === "EUR"
        ? t.labels.perYearInclVat
        : t.labels.perYear
      : displayCurrency === "EUR"
        ? t.labels.perMonthInclVat
        : t.labels.perMonth;

  function planPriceDisplay(plan: PaidPlanKey): {
    value: string;
    note?: string;
    currencySym: string;
    periodLabel: string;
  } {
    const resolved = resolvePlanPrice(plan, billingPeriod, currency);
    if (!resolved) {
      if (billingPeriod === "yearly") {
        const monthly = resolvePlanPrice(plan, "monthly", currency);
        if (monthly) {
          return {
            value: monthly.amount.toFixed(2),
            note: t.plan.planCtaPeriodNotAvailable,
            currencySym: CURRENCY_SYMBOLS[monthly.currency],
            periodLabel: planPeriodLabelFor("monthly", monthly.currency),
          };
        }
      }
      return {
        value: "—",
        note: t.plan.planCtaPeriodNotAvailable,
        currencySym: currencySymbol,
        periodLabel: planPeriodLabelFor(billingPeriod),
      };
    }
    const decimals = billingPeriod === "yearly" ? 0 : 2;
    return {
      value: resolved.amount.toFixed(decimals),
      currencySym: CURRENCY_SYMBOLS[resolved.currency],
      periodLabel: planPeriodLabelFor(billingPeriod, resolved.currency),
    };
  }

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
    () =>
      evaluateCheckoutEligibility(activeCheckoutCtx, "starter", billingPeriod, {
        yearlyAvailable: isYearlyPlanAvailable("starter", currency),
      }),
    [activeCheckoutCtx, billingPeriod, currency],
  );

  const proCheckoutElig = React.useMemo(
    () =>
      evaluateCheckoutEligibility(activeCheckoutCtx, "pro", billingPeriod, {
        yearlyAvailable: isYearlyPlanAvailable("pro", currency),
      }),
    [activeCheckoutCtx, billingPeriod, currency],
  );

  const businessCheckoutElig = React.useMemo(
    () =>
      evaluateCheckoutEligibility(activeCheckoutCtx, "business", billingPeriod, {
        yearlyAvailable: isYearlyPlanAvailable("business", currency),
      }),
    [activeCheckoutCtx, billingPeriod, currency],
  );

  const proBlockedYearlyStarterRule =
    activeCheckoutCtx?.tier === "starter" &&
    activeCheckoutCtx.period === "yearly" &&
    billingPeriod === "monthly";

  const starterPlanDisabled = loading || !starterCheckoutElig.ok;
  const proPlanDisabled = loading || !proCheckoutElig.ok || proBlockedYearlyStarterRule;
  const businessPlanDisabled = loading || !businessCheckoutElig.ok;

  function starterPlanCtaText(): string {
    if (busyPlan === "starter") return t.plan.starterBtnBusy;
    if (!starterCheckoutElig.ok) {
      if (starterCheckoutElig.code === "already_have_plan") return t.plan.planCtaCurrent;
      if (starterCheckoutElig.code === "period_not_available") return t.plan.planCtaPeriodNotAvailable;
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
      if (proCheckoutElig.code === "period_not_available") return t.plan.planCtaPeriodNotAvailable;
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

  function businessPlanCtaText(): string {
    if (busyPlan === "business") return t.plan.starterBtnBusy;
    if (!businessCheckoutElig.ok) {
      if (businessCheckoutElig.code === "already_have_plan") return t.plan.planCtaCurrent;
      if (businessCheckoutElig.code === "period_not_available")
        return t.plan.planCtaPeriodNotAvailable;
      if (businessCheckoutElig.code === "interval_downgrade_not_allowed")
        return t.plan.planCtaYearlyBillingOnly;
      return t.plan.planCtaDowngradeNotAvailable;
    }
    if (activeCheckoutCtx?.tier === "starter" || activeCheckoutCtx?.tier === "pro") {
      return t.plan.planCtaUpgradeBusiness;
    }
    if (
      activeCheckoutCtx?.tier === "business" &&
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

  async function handleUpgradePlan(plan: PaidPlanKey) {
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

  const isStarterCurrent =
    activeCheckoutCtx?.tier === "starter" && activeCheckoutCtx.period === billingPeriod;
  const isProCurrent =
    activeCheckoutCtx?.tier === "pro" && activeCheckoutCtx.period === billingPeriod;
  const isBusinessCurrent =
    activeCheckoutCtx?.tier === "business" && activeCheckoutCtx.period === billingPeriod;

  const showTrial = !activePaidPlan;

  const featureList = (features: readonly string[]) => (
    <ul className="billing-plan-features">
      {features.map((f) => (
        <li key={f}>
          <Check size={14} className="billing-plan-check" aria-hidden />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );

  const priceBlock = (value: string, sym: string = currencySymbol, periodLabel: string, note?: string) => (
    <div className="billing-plan-price">
      <span className="billing-plan-price-value">{value}</span>
      <span className="billing-plan-price-cur">{sym}</span>
      <span className="billing-plan-price-period">{periodLabel}</span>
      {note ? (
        <span className={`billing-plan-price-note text-xs ${isLight ? "text-amber-700" : "text-amber-300"}`}>
          {note}
        </span>
      ) : null}
    </div>
  );

  const starterPrice = planPriceDisplay("starter");
  const proPrice = planPriceDisplay("pro");
  const businessPrice = planPriceDisplay("business");

  const gridClass = showTrial ? "billing-plan-grid--4" : "billing-plan-grid--3";

  return (
    <section id="billing-plans" className="dashboard-panel dashboard-panel--wide scroll-mt-20 billing-plans">
      <div className="billing-plans-head">
        <h2 className="dashboard-panel-title">{c.sectionUpgradePlans}</h2>
        <div
          className={`inline-flex rounded-full p-0.5 ${isLight ? "bg-slate-200/80" : "bg-slate-800/80"}`}
          role="group"
          aria-label={t.plan.billingIntervalLabel}
        >
          <button
            type="button"
            aria-pressed={billingPeriod === "monthly"}
            onClick={() => setBillingPeriod("monthly")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
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
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
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

      <div className={`billing-plan-grid ${gridClass}`}>
        {showTrial ? (
          <div className={`billing-plan-card ${portalCardShell(isLight)}`}>
            <div className="billing-plan-top">
              <div className="billing-plan-name-row">
                <span className="billing-plan-name">{t.plan.trialTitle}</span>
              </div>
              {priceBlock("0", currencySymbol, planPeriodLabelFor("monthly"))}
              {featureList(c.trialFeatures)}
            </div>
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
          </div>
        ) : null}

        <div
          className={`billing-plan-card ${portalCardShell(isLight)} ${
            isStarterCurrent || !activePaidPlan ? "billing-plan-card--highlight" : ""
          }`}
        >
          <div className="billing-plan-top">
            <div className="billing-plan-name-row">
              <span className="billing-plan-name">{t.pos.planStarter}</span>
              {isStarterCurrent ? (
                <span className="billing-plan-badge">{c.currentPlanBadge}</span>
              ) : !activePaidPlan ? (
                <span className="billing-plan-badge">{t.labels.recommended}</span>
              ) : null}
            </div>
            {priceBlock(starterPrice.value, starterPrice.currencySym, starterPrice.periodLabel, starterPrice.note)}
            {featureList(c.starterFeatures)}
          </div>
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
        </div>

        <div
          className={`billing-plan-card ${portalCardShell(isLight)} ${
            isProCurrent ? "billing-plan-card--highlight" : ""
          }`}
        >
          <div className="billing-plan-top">
            <div className="billing-plan-name-row">
              <span className="billing-plan-name">{t.pos.planPro}</span>
              {isProCurrent ? (
                <span className="billing-plan-badge">{c.currentPlanBadge}</span>
              ) : null}
            </div>
            {priceBlock(proPrice.value, proPrice.currencySym, proPrice.periodLabel, proPrice.note)}
            {featureList(c.proFeatures)}
          </div>
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
        </div>

        <div
          className={`billing-plan-card ${portalCardShell(isLight)} ${
            isBusinessCurrent ? "billing-plan-card--highlight" : ""
          }`}
        >
          <div className="billing-plan-top">
            <div className="billing-plan-name-row">
              <span className="billing-plan-name">{t.pos.planBusiness}</span>
              {isBusinessCurrent ? (
                <span className="billing-plan-badge">{c.currentPlanBadge}</span>
              ) : null}
            </div>
            {priceBlock(
              businessPrice.value,
              businessPrice.currencySym,
              businessPrice.periodLabel,
              businessPrice.note,
            )}
            {featureList(c.businessFeatures)}
          </div>
          <button
            type="button"
            onClick={() => handleUpgradePlan("business")}
            disabled={busyPlan === "business" || businessPlanDisabled}
            className={`w-full ${
              busyPlan === "business" || businessPlanDisabled
                ? portalSecondaryCta(isLight)
                : portalPrimaryCta()
            }`}
          >
            {businessPlanCtaText()}
          </button>
        </div>
      </div>

      <p className={`billing-plans-footnote text-xs ${isLight ? "text-slate-500" : "text-slate-500"}`}>
        {t.plan.vatFootnote}
      </p>
    </section>
  );
}
