// apps/caisty-site/src/routes/PortalPlanBillingPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  createTrialLicense,
  fetchPortalLicenses,
  fetchPortalMe,
  createStripeBillingPortalSession,
  type PortalLicense,
} from "../lib/portalApi";
import { usePortalOutlet } from "./PortalLayout";
import { PRICING, TRIAL_DAYS, CURRENCY_SYMBOLS } from "../config/pricing";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { pickPrimaryPortalLicense, getActivePaidPlanTier } from "../lib/portalLicensePick";
import { useCurrency } from "../lib/useCurrency";
import {
  evaluateCheckoutEligibility,
  type PaidPlanContext,
} from "../lib/checkoutPlanEligibility";
import {
  portalCardShell,
  portalLicenseStatusBadge,
  portalPageShell,
  portalPageSubtitle,
  portalPageTitle,
  portalPrimaryCta,
  portalSecondaryCta,
  portalTextLink,
} from "../lib/portalUi";

type BillingPeriod = "monthly" | "yearly";

const PortalPlanBillingPage: React.FC = () => {
  const { customer, setCustomer } = usePortalOutlet();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const locale = portalLocaleTag(language);
  const { theme } = useTheme();
  const isLight = theme === "light";

  const { currency } = useCurrency();
  const [billingPeriod, setBillingPeriod] = React.useState<BillingPeriod>("monthly");

  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyTrial, setBusyTrial] = React.useState(false);
  const [busyPlan, setBusyPlan] = React.useState<"starter" | "pro" | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [busyBillingPortal, setBusyBillingPortal] = React.useState(false);

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

  function formatDate(value: string | null | undefined): string {
    if (!value) return t.labels.dash;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return t.labels.dash;
    return d.toLocaleString(locale);
  }

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const lics = await fetchPortalLicenses();
        if (!cancelled) setLicenses(lics);
      } catch (err: unknown) {
        console.error("load licenses failed", err);
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : null;
          setError(msg || getPortalTranslations(language).plan.loadError);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  React.useEffect(() => {
    let cancelled = false;
    fetchPortalMe()
      .then((me) => {
        if (!cancelled && me) setCustomer(me);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setCustomer]);

  const primaryLicense: PortalLicense | null = React.useMemo(
    () => pickPrimaryPortalLicense(licenses),
    [licenses],
  );

  const activePaidPlan = React.useMemo(
    () => getActivePaidPlanTier(licenses),
    [licenses],
  );

  const hasTrialLicense = React.useMemo(
    () => licenses.some((l) => l.plan === "trial"),
    [licenses],
  );

  const paidPeriod = customer.paidBillingPeriod ?? null;

  const activeCheckoutCtx = React.useMemo<PaidPlanContext | null>(
    () => (activePaidPlan ? { tier: activePaidPlan, period: paidPeriod } : null),
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
  const proPlanDisabled =
    loading || !proCheckoutElig.ok || proBlockedYearlyStarterRule;

  function starterPlanCtaText(): string {
    if (busyPlan === "starter") return t.plan.starterBtnBusy;
    if (!starterCheckoutElig.ok) {
      if (starterCheckoutElig.code === "already_have_plan")
        return t.plan.planCtaCurrent;
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
      if (proCheckoutElig.code === "already_have_plan")
        return t.plan.planCtaCurrent;
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
      setError(null);
      setBusyTrial(true);
      const lic = await createTrialLicense();
      setLicenses((prev) => [lic, ...prev]);
    } catch (err: unknown) {
      console.error("create trial failed", err);
      setError(
        err instanceof Error ? err.message : t.plan.trialCreateError,
      );
    } finally {
      setBusyTrial(false);
    }
  }

  async function handleManageSubscription() {
    try {
      setError(null);
      setBusyBillingPortal(true);
      const portalBase =
        import.meta.env.DEV
          ? "http://localhost:5173"
          : import.meta.env.VITE_PORTAL_BASE_URL || window.location.origin;
      const returnUrl = `${String(portalBase).replace(/\/+$/, "")}/portal/plan`;
      const url = await createStripeBillingPortalSession(returnUrl);
      window.location.href = url;
    } catch (err: unknown) {
      console.error("billing portal failed", err);
      setError(
        err instanceof Error ? err.message : t.plan.billingPortalError,
      );
    } finally {
      setBusyBillingPortal(false);
    }
  }

  async function handleUpgradePlan(plan: "starter" | "pro") {
    try {
      setError(null);
      setBusyPlan(plan);
      const planId = `${plan}_${billingPeriod}`;
      window.location.href = `/portal/checkout?plan=${encodeURIComponent(planId)}`;
    } catch (err: unknown) {
      console.error("upgrade failed", err);
      setError(
        err instanceof Error ? err.message : t.plan.upgradeError,
      );
    } finally {
      setBusyPlan(null);
    }
  }

  const trialDaysLabel = t.plan.trialPriceSuffix.replace(
    "{{days}}",
    String(TRIAL_DAYS),
  );

  return (
    <div className={portalPageShell()}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{t.plan.title}</h1>
        <p className={portalPageSubtitle(isLight)}>{t.plan.subtitle}</p>
      </header>

      {error && (
        <div className={`rounded-xl border px-3 py-2 text-xs ${isLight ? "border-red-300 bg-red-50 text-red-800" : "border-red-700 bg-red-900/40 text-red-100"}`}>
          {error}
        </div>
      )}

      <section className={`${portalCardShell(isLight)} overflow-hidden`}>
        <div className="border-l-4 border-orange-500/45 pl-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className={`text-xs font-semibold tracking-wide uppercase ${isLight ? "text-orange-600" : "text-orange-400"}`}>
            {t.plan.currentPlanLabel}
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className={`h-4 w-40 rounded animate-pulse ${isLight ? "bg-slate-200" : "bg-slate-800"}`} />
              <div className={`h-3 w-24 rounded animate-pulse ${isLight ? "bg-slate-200" : "bg-slate-800"}`} />
            </div>
          ) : !primaryLicense ? (
            <div className={`text-xs ${isLight ? "text-slate-700" : "text-slate-200"}`}>
              {t.plan.noActiveBody}
            </div>
          ) : (
            <>
              <div className={`flex flex-wrap items-center gap-3 ${isLight ? "text-slate-900" : "text-slate-50"}`}>
                <span className="text-2xl font-bold tracking-tight">
                  {primaryLicense.plan === "trial"
                    ? t.plan.trialTitle
                    : primaryLicense.plan === "starter"
                      ? "Starter"
                      : "Pro"}
                </span>
                <span
                  className={portalLicenseStatusBadge(
                    primaryLicense.status,
                    isLight,
                  )}
                >
                  {primaryLicense.status}
                </span>
              </div>
              <div className={`text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                {t.plan.licenseKeyLabel}{" "}
                <span className="font-mono text-xs">
                  {primaryLicense.key}
                </span>
              </div>
              <div className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                {t.labels.validUntil}: {formatDate(primaryLicense.validUntil)}
              </div>
              {paidPeriod &&
                (primaryLicense.plan === "starter" ||
                  primaryLicense.plan === "pro") && (
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

          <div className={`mt-2 space-y-1 text-xs text-right md:mt-0 md:max-w-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
          <div>{t.plan.accountHolder} {customer.name}</div>
          {primaryLicense && (
            <div>
              {t.plan.licenseKeyLabel}{" "}
              <span className="font-mono text-[11px]">
                {primaryLicense.key}
              </span>
            </div>
          )}
          <div className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>
            {t.plan.paymentNote}
          </div>
        </div>
        </div>
      </section>

      {customer.stripeBillingPortalEligible && (
        <section className={`${portalCardShell(isLight)} px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
          <div className="space-y-1">
            <div className={`text-xs font-semibold tracking-wide uppercase ${isLight ? "text-orange-600" : "text-orange-400"}`}>
              {t.plan.subscriptionSectionTitle}
            </div>
            <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              {t.plan.subscriptionSectionBody}
            </p>
          </div>
          <button
            type="button"
            onClick={handleManageSubscription}
            disabled={busyBillingPortal}
            className={`shrink-0 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              busyBillingPortal ? portalSecondaryCta(isLight) : portalPrimaryCta()
            }`}
          >
            {busyBillingPortal
              ? t.plan.manageSubscriptionBusy
              : t.plan.manageSubscription}
          </button>
        </section>
      )}

      <section className="space-y-6">
        <h2 className={`text-sm font-semibold tracking-tight ${isLight ? "text-slate-900" : "text-slate-100"}`}>
          {t.plan.sectionTitle}
        </h2>
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

        <div className="grid gap-5 md:grid-cols-3">
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
        </div>

        <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-500"}`}>
          {t.plan.vatFootnote}
        </p>
      </section>

      <section className={`${portalCardShell(isLight)} text-xs ${isLight ? "text-slate-700" : "text-slate-300"}`}>
        {t.plan.invoicesLineStart}{" "}
        <Link to="/portal/invoices" className={`hover:underline ${portalTextLink(isLight)}`}>
          {t.layout.navInvoices}
        </Link>
        {t.plan.invoicesLineEnd}
      </section>
    </div>
  );
};

export default PortalPlanBillingPage;
