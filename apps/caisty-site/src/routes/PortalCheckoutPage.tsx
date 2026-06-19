// apps/caisty-site/src/routes/PortalCheckoutPage.tsx
import React from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { PRICING, formatPrice } from "../config/pricing";
import { breakdownVatInclusive } from "../lib/vatDisplay";
import { useCurrency } from "../lib/useCurrency";
import {
  fetchPortalLicenses,
  fetchPortalMe,
  getStoredPortalToken,
  type PortalLicense,
} from "../lib/portalApi";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { getActivePaidPlanTier } from "../lib/portalLicensePick";
import {
  evaluateCheckoutEligibility,
  type PaidPlanContext,
} from "../lib/checkoutPlanEligibility";

type PaymentMethod = "paypal" | "card";

const CHECKOUT_PLAN_IDS = new Set([
  "starter",
  "pro",
  "starter_monthly",
  "starter_yearly",
  "pro_monthly",
  "pro_yearly",
]);

function parsePortalCheckoutPlan(param: string | null): {
  tier: "starter" | "pro";
  period: "monthly" | "yearly";
  planId: string;
} | null {
  if (!param) return null;
  const raw = param.trim().toLowerCase();
  if (!CHECKOUT_PLAN_IDS.has(raw)) return null;
  if (raw === "starter" || raw === "pro") {
    const tier = raw as "starter" | "pro";
    return { tier, period: "monthly", planId: `${tier}_monthly` };
  }
  const tier = raw.startsWith("starter") ? "starter" : "pro";
  const period = raw.endsWith("_yearly") ? "yearly" : "monthly";
  return { tier, period, planId: `${tier}_${period}` };
}

const PortalCheckoutPage: React.FC = () => {
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);

  const planParam = searchParams.get("plan");
  const parsedPlan = React.useMemo(
    () => parsePortalCheckoutPlan(planParam),
    [planParam],
  );
  const isValidPlan = Boolean(parsedPlan);

  const [selectedPaymentMethod] = React.useState<PaymentMethod>("card");
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [portalLicenses, setPortalLicenses] = React.useState<PortalLicense[]>([]);
  const [licensesLoading, setLicensesLoading] = React.useState(true);
  const [paidBillingPeriod, setPaidBillingPeriod] = React.useState<
    "monthly" | "yearly" | null
  >(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLicensesLoading(true);
        const token = getStoredPortalToken();
        if (!token) {
          if (!cancelled) setLicensesLoading(false);
          return;
        }
        const list = await fetchPortalLicenses();
        if (!cancelled) setPortalLicenses(list);
      } catch {
        if (!cancelled) setPortalLicenses([]);
      } finally {
        if (!cancelled) setLicensesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    fetchPortalMe()
      .then((me) => {
        if (!cancelled) setPaidBillingPeriod(me?.paidBillingPeriod ?? null);
      })
      .catch(() => {
        if (!cancelled) setPaidBillingPeriod(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activePaidPlan = React.useMemo(
    () => getActivePaidPlanTier(portalLicenses),
    [portalLicenses],
  );

  const activeCheckoutCtx = React.useMemo<PaidPlanContext | null>(
    () =>
      activePaidPlan ? { tier: activePaidPlan, period: paidBillingPeriod } : null,
    [activePaidPlan, paidBillingPeriod],
  );

  const checkoutEligibility = React.useMemo(() => {
    if (!parsedPlan) return { ok: true as const };
    return evaluateCheckoutEligibility(
      activeCheckoutCtx,
      parsedPlan.tier,
      parsedPlan.period,
    );
  }, [activeCheckoutCtx, parsedPlan]);

  const checkoutBlockedProYearlyStarter = Boolean(
    parsedPlan &&
      activeCheckoutCtx?.tier === "starter" &&
      activeCheckoutCtx.period === "yearly" &&
      parsedPlan.tier === "pro" &&
      parsedPlan.period === "monthly",
  );

  const checkoutBlocked =
    !checkoutEligibility.ok || checkoutBlockedProYearlyStarter;

  React.useEffect(() => {
    if (!isValidPlan) {
      navigate("/portal/plan", { replace: true });
    }
  }, [isValidPlan, navigate]);

  if (!isValidPlan || !parsedPlan) {
    return null;
  }

  const { tier: plan, period: billingPeriod, planId } = parsedPlan;
  const planPrice = PRICING[currency][plan][billingPeriod];
  const vatBreakdown =
    currency === "EUR" ? breakdownVatInclusive(planPrice) : null;
  const periodLabel =
    billingPeriod === "yearly"
      ? currency === "EUR"
        ? t.labels.perYearInclVat
        : t.labels.perYear
      : currency === "EUR"
        ? t.labels.perMonthInclVat
        : t.labels.perMonth;
  const planName = plan === "starter" ? "Starter" : "Pro";
  const planDescription =
    plan === "starter" ? t.checkout.planStarterDesc : t.checkout.planProDesc;

  async function handlePayment() {
    try {
      setError(null);
      setProcessing(true);

      const provider = selectedPaymentMethod === "card" ? "stripe" : "paypal";

      const token = getStoredPortalToken();
      if (!token) {
        setError(t.checkout.notSignedIn);
        navigate("/login");
        return;
      }

      if (licensesLoading) {
        setError(t.checkout.checkoutFailed);
        return;
      }

      if (checkoutBlocked) {
        if (checkoutBlockedProYearlyStarter) {
          setError(t.checkout.upgradeProYearlyOnly);
        } else if (!checkoutEligibility.ok) {
          if (checkoutEligibility.code === "downgrade_not_allowed") {
            setError(t.checkout.downgradeNotAvailable);
          } else if (
            checkoutEligibility.code === "interval_downgrade_not_allowed"
          ) {
            setError(t.checkout.intervalDowngradeNotAllowed);
          } else {
            setError(t.checkout.alreadyHavePlan);
          }
        }
        return;
      }

      const API_BASE = import.meta.env.VITE_CLOUD_API_URL ||
        (import.meta.env.DEV ? "http://localhost:3333" : "https://api.caisty.com");

      const getPortalBaseUrl = () => {
        if (import.meta.env.DEV) {
          return "http://localhost:5173";
        }
        return import.meta.env.VITE_PORTAL_BASE_URL || window.location.origin;
      };

      const portalBaseUrl = getPortalBaseUrl();

      const checkoutRes = await fetch(`${API_BASE}/api/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Idempotency-Key": `checkout:${planId}:${provider}:${Date.now()}`,
        },
        body: JSON.stringify({
          provider,
          planId,
          returnUrl: `${portalBaseUrl}/portal/checkout/success`,
          cancelUrl: `${portalBaseUrl}/portal/checkout/cancel`,
          currency: currency,
        }),
      });

      if (checkoutRes.status === 401) {
        setError(t.checkout.notSignedIn);
        navigate("/login");
        return;
      }

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok || !checkoutData.ok) {
        if (checkoutData.error === "already_have_plan") {
          throw new Error(t.checkout.alreadyHavePlan);
        }
        if (checkoutData.error === "downgrade_not_allowed") {
          throw new Error(t.checkout.downgradeNotAvailable);
        }
        if (checkoutData.error === "interval_downgrade_not_allowed") {
          throw new Error(t.checkout.intervalDowngradeNotAllowed);
        }
        throw new Error(checkoutData.message ?? t.checkout.checkoutFailed);
      }

      if (checkoutData.invoiceId) {
      if (checkoutData.invoiceId) {
        sessionStorage.setItem("pendingInvoiceId", checkoutData.invoiceId);
      } else {
        sessionStorage.removeItem("pendingInvoiceId");
      }
      if (checkoutData.subscriptionId) {
        sessionStorage.setItem("pendingSubscriptionId", checkoutData.subscriptionId);
      }
      }

      if (checkoutData.checkoutUrl) {
        window.location.href = checkoutData.checkoutUrl;
        return;
      }

      navigate("/portal/invoices");
    } catch (err: unknown) {
      console.error("payment failed", err);
      setError(
        err instanceof Error ? err.message : t.checkout.paymentFailed,
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t.checkout.title}
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              {t.checkout.subtitle}
            </p>
          </div>
          <Link
            to="/portal/plan"
            className="text-sm text-orange-300 hover:text-orange-200"
          >
            {t.checkout.backLink}
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-700 bg-red-900/40 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {!licensesLoading && checkoutBlocked && (
        <div className="rounded-xl border border-amber-600/50 bg-amber-900/25 px-4 py-3 text-sm text-amber-100 space-y-2">
          <p>
            {checkoutBlockedProYearlyStarter
              ? t.checkout.upgradeProYearlyOnly
              : !checkoutEligibility.ok &&
                  checkoutEligibility.code === "downgrade_not_allowed"
                ? t.checkout.downgradeNotAvailable
                : !checkoutEligibility.ok &&
                    checkoutEligibility.code ===
                      "interval_downgrade_not_allowed"
                  ? t.checkout.intervalDowngradeNotAllowed
                  : t.checkout.alreadyHavePlan}
          </p>
          <Link
            to="/portal/plan"
            className="inline-block text-orange-300 hover:text-orange-200 underline font-medium"
          >
            {t.checkout.backToPlans}
          </Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold mb-4">{t.checkout.yourOrder}</h2>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-50">
                      {planName}
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 text-[11px] font-medium text-orange-300">
                      {billingPeriod === "yearly"
                        ? t.checkout.yearlyBadge
                        : t.checkout.monthlyBadge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {planDescription}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-orange-400">
                    {formatPrice(planPrice, currency)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {periodLabel}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                {vatBreakdown ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{t.labels.subtotalInclVat}</span>
                      <span className="text-slate-100">{formatPrice(planPrice, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{t.labels.includedVat19}</span>
                      <span className="text-slate-100">
                        {formatPrice(vatBreakdown.includedVat, currency)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-base font-semibold text-slate-50">{t.labels.totalDue}</span>
                      <span className="text-xl font-semibold text-orange-400">
                        {formatPrice(planPrice, currency)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-slate-50">{t.labels.total}</span>
                    <span className="text-xl font-semibold text-orange-400">
                      {formatPrice(planPrice, currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold mb-4">{t.checkout.paymentMethod}</h2>

            <div className="space-y-3">
              <div
                className="flex items-start gap-3 p-4 rounded-xl border-2 border-orange-500/50 bg-orange-500/10"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-50">{t.checkout.cardTitle}</span>
                    <span className="inline-flex items-center rounded-full bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 text-[10px] font-medium text-orange-300">
                      {t.labels.available}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {t.checkout.cardHint}
                  </p>
                </div>
                <div className="text-2xl">💳</div>
              </div>
            </div>
          </section>
        </div>

        <div className="md:col-span-1">
          <div className="sticky top-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h2 className="text-lg font-semibold">{t.checkout.orderSummary}</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t.labels.plan}</span>
                <span className="text-slate-100 font-medium">{planName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t.labels.billingPeriod}</span>
                <span className="text-slate-100 font-medium">
                  {billingPeriod === "yearly" ? t.labels.yearly : t.labels.monthly}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t.labels.paymentMethod}</span>
                <span className="text-slate-100 font-medium">
                  {t.checkout.cardName}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">
                  {vatBreakdown ? t.labels.totalDue : t.labels.total}
                </span>
                <span className="text-xl font-semibold text-orange-400">
                  {formatPrice(planPrice, currency)}
                </span>
              </div>
              {vatBreakdown && (
                <div className="text-xs text-slate-500">
                  {t.labels.includedVat19}: {formatPrice(vatBreakdown.includedVat, currency)}
                </div>
              )}
              {!vatBreakdown && (
                <div className="text-xs text-slate-500">{t.labels.incVat}</div>
              )}
            </div>

            <button
              type="button"
              onClick={handlePayment}
              disabled={processing || licensesLoading || checkoutBlocked}
              className="w-full inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              {processing
                ? t.checkout.processing
                : selectedPaymentMethod === "paypal"
                  ? t.checkout.payPaypal
                  : t.checkout.payCard}
            </button>

            <p className="text-[11px] text-slate-500 text-center">
              {t.checkout.termsPrefix}{" "}
              <Link to="/terms" className="text-orange-300 hover:text-orange-200">
                {t.checkout.termsLink}
              </Link>{" "}
              {t.checkout.conjunctionAnd}{" "}
              <Link to="/privacy" className="text-orange-300 hover:text-orange-200">
                {t.checkout.privacyLink}
              </Link>
              {t.checkout.termsSuffix}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalCheckoutPage;
