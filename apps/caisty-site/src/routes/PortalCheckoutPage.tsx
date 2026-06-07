// apps/caisty-site/src/routes/PortalCheckoutPage.tsx
import React from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { PRICING, formatPrice } from "../config/pricing";
import { useCurrency } from "../lib/useCurrency";
import { getStoredPortalToken } from "../lib/portalApi";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";

type PaymentMethod = "paypal" | "card";

const PortalCheckoutPage: React.FC = () => {
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);

  const planParam = searchParams.get("plan");
  const isValidPlan = planParam === "starter" || planParam === "pro";

  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<PaymentMethod>("paypal");
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isValidPlan) {
      navigate("/portal/plan", { replace: true });
    }
  }, [isValidPlan, navigate]);

  if (!isValidPlan || !planParam) {
    return null;
  }

  const plan: "starter" | "pro" = planParam;
  const planPrice = PRICING[currency][plan].monthly;
  const planName = plan === "starter" ? "Starter" : "Pro";
  const planDescription =
    plan === "starter" ? t.checkout.planStarterDesc : t.checkout.planProDesc;

  const selectedBorder = "rgb(249 115 22)";
  const idleBorder = "#334155";

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
          "Idempotency-Key": `checkout:${plan}:${provider}:${Date.now()}`,
        },
        body: JSON.stringify({
          provider,
          planId: `${plan}_monthly`,
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
        throw new Error(checkoutData.message ?? t.checkout.checkoutFailed);
      }

      if (checkoutData.invoiceId) {
        sessionStorage.setItem("pendingInvoiceId", checkoutData.invoiceId);
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
                      {t.labels.monthly}
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
                  <div className="text-xs text-slate-400">{t.labels.perMonth}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{t.labels.subtotal}</span>
                  <span className="text-slate-100">{formatPrice(planPrice, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{t.labels.vat19}</span>
                  <span className="text-slate-100">
                    {formatPrice(planPrice * 0.19, currency)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-50">{t.labels.total}</span>
                  <span className="text-xl font-semibold text-orange-400">
                    {formatPrice(planPrice * 1.19, currency)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold mb-4">{t.checkout.paymentMethod}</h2>

            <div className="space-y-3">
              <label
                className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors hover:bg-slate-800/50"
                style={{
                  borderColor: selectedPaymentMethod === "paypal" ? selectedBorder : idleBorder,
                  backgroundColor: selectedPaymentMethod === "paypal" ? "rgba(249, 115, 22, 0.08)" : "transparent",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paypal"
                  checked={selectedPaymentMethod === "paypal"}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                  className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 focus:ring-offset-2"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-50">{t.checkout.paypalName}</span>
                    <span className="inline-flex items-center rounded-full bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 text-[10px] font-medium text-orange-300">
                      {t.labels.available}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {t.checkout.paypalHint}
                  </p>
                </div>
                <div className="text-2xl">💳</div>
              </label>

              <label
                className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors hover:bg-slate-800/50"
                style={{
                  borderColor: selectedPaymentMethod === "card" ? selectedBorder : idleBorder,
                  backgroundColor: selectedPaymentMethod === "card" ? "rgba(249, 115, 22, 0.08)" : "transparent",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={selectedPaymentMethod === "card"}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                  className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 focus:ring-offset-2"
                />
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
              </label>
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
                <span className="text-slate-100 font-medium">{t.labels.monthly}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t.labels.paymentMethod}</span>
                <span className="text-slate-100 font-medium">
                  {selectedPaymentMethod === "paypal" ? t.checkout.paypalName : t.checkout.cardName}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">{t.labels.total}</span>
                <span className="text-xl font-semibold text-orange-400">
                  {formatPrice(planPrice * 1.19, currency)}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {t.labels.incVat}
              </div>
            </div>

            <button
              type="button"
              onClick={handlePayment}
              disabled={processing}
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
