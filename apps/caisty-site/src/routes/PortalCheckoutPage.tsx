// apps/caisty-site/src/routes/PortalCheckoutPage.tsx
import React from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { PRICING, formatPrice } from "../config/pricing";
import { useCurrency } from "../lib/useCurrency";
import { getStoredPortalToken } from "../lib/portalApi";

type PaymentMethod = "paypal" | "card";

const PortalCheckoutPage: React.FC = () => {
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const planParam = searchParams.get("plan");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<PaymentMethod>("paypal");
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Validierung: Plan muss vorhanden sein
  const isValidPlan = planParam === "starter" || planParam === "pro";
  
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
  const planDescription = plan === "starter"
    ? "Ideal für eine Filiale oder einen Standort. Lizenzverwaltung im Kundenportal, Basis-Statistiken & Export-Grundfunktionen."
    : "Für Betriebe mit mehreren Kassen oder kleinen Filialketten. Mehrere Geräte unter einer Lizenz, erweiterte Auswertungen (geplant), priorisierter Support.";

  async function handlePayment() {
    try {
      setError(null);
      setProcessing(true);

      // Neue Billing-API verwenden (unterstützt PayPal + Stripe)
      const provider = selectedPaymentMethod === "card" ? "stripe" : "paypal";
      
      const token = getStoredPortalToken();
      if (!token) {
        setError("Nicht angemeldet. Bitte melde dich erneut an.");
        navigate("/login");
        return;
      }

      const API_BASE = import.meta.env.VITE_CLOUD_API_URL || 
        (import.meta.env.DEV ? "http://localhost:3333" : "https://api.caisty.com");

      // Portal Base URL: Im Development IMMER Port 5173 (Kundenportal), nie 5175 (Admin)
      const getPortalBaseUrl = () => {
        if (import.meta.env.DEV) {
          // Development: Force Port 5173 (Kundenportal)
          return "http://localhost:5173";
        }
        // Production: Use window.location.origin or env var
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
        setError("Nicht angemeldet. Bitte melde dich erneut an.");
        navigate("/login");
        return;
      }

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok || !checkoutData.ok) {
        throw new Error(checkoutData.message ?? "Checkout konnte nicht gestartet werden.");
      }

      // Store invoiceId for success page
      if (checkoutData.invoiceId) {
        sessionStorage.setItem("pendingInvoiceId", checkoutData.invoiceId);
      }

      // Redirect zur Checkout-URL (PayPal oder Stripe)
      if (checkoutData.checkoutUrl) {
        window.location.href = checkoutData.checkoutUrl;
        return;
      }

      // Fallback: kein redirectUrl → Nutzer zu Rechnungen schicken
      navigate("/portal/invoices");
    } catch (err: any) {
      console.error("payment failed", err);
      setError(err?.message ?? "Zahlung konnte nicht gestartet werden.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Zahlung abschließen
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Überprüfe deine Bestellung und wähle eine Zahlungsmethode
            </p>
          </div>
          <Link
            to="/portal/plan"
            className="text-sm text-emerald-300 hover:text-emerald-200"
          >
            ← Zurück
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-700 bg-red-900/40 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Warenkorb & Bestellübersicht (2 Spalten) */}
        <div className="md:col-span-2 space-y-4">
          {/* Warenkorb */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold mb-4">Deine Bestellung</h2>
            
            <div className="space-y-4">
              {/* Plan-Karte */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-50">
                      {planName}
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                      Monatlich
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {planDescription}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-emerald-400">
                    {formatPrice(planPrice, currency)}
                  </div>
                  <div className="text-xs text-slate-400">pro Monat</div>
                </div>
              </div>

              {/* Zusammenfassung */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Zwischensumme</span>
                  <span className="text-slate-100">{formatPrice(planPrice, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">MwSt. (19%)</span>
                  <span className="text-slate-100">
                    {formatPrice(planPrice * 0.19, currency)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-50">Gesamtbetrag</span>
                  <span className="text-xl font-semibold text-emerald-400">
                    {formatPrice(planPrice * 1.19, currency)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Zahlungsmethode */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold mb-4">Zahlungsmethode</h2>
            
            <div className="space-y-3">
              {/* PayPal */}
              <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors hover:bg-slate-800/50"
                style={{
                  borderColor: selectedPaymentMethod === "paypal" ? "#10b981" : "#334155",
                  backgroundColor: selectedPaymentMethod === "paypal" ? "rgba(16, 185, 129, 0.1)" : "transparent",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paypal"
                  checked={selectedPaymentMethod === "paypal"}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                  className="mt-1 h-4 w-4 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-2"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-50">PayPal</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                      Verfügbar
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Bezahle sicher mit deinem PayPal-Konto
                  </p>
                </div>
                <div className="text-2xl">💳</div>
              </label>

              {/* Mastercard / Visa */}
              <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors hover:bg-slate-800/50"
                style={{
                  borderColor: selectedPaymentMethod === "card" ? "#10b981" : "#334155",
                  backgroundColor: selectedPaymentMethod === "card" ? "rgba(16, 185, 129, 0.1)" : "transparent",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={selectedPaymentMethod === "card"}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                  className="mt-1 h-4 w-4 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-2"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-50">Kreditkarte</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                      Verfügbar
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Mastercard & Visa – sicher bezahlen
                  </p>
                </div>
                <div className="text-2xl">💳</div>
              </label>
            </div>
          </section>
        </div>

        {/* Sidebar: Zusammenfassung & Button (1 Spalte) */}
        <div className="md:col-span-1">
          <div className="sticky top-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Bestellübersicht</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Plan</span>
                <span className="text-slate-100 font-medium">{planName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Abrechnungszeitraum</span>
                <span className="text-slate-100 font-medium">Monatlich</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Zahlungsmethode</span>
                <span className="text-slate-100 font-medium">
                  {selectedPaymentMethod === "paypal" ? "PayPal" : "Kreditkarte"}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Gesamtbetrag</span>
                <span className="text-xl font-semibold text-emerald-400">
                  {formatPrice(planPrice * 1.19, currency)}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                inkl. MwSt.
              </div>
            </div>

            <button
              type="button"
              onClick={handlePayment}
              disabled={processing}
              className="w-full inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              {processing
                ? "Wird verarbeitet…"
                : selectedPaymentMethod === "paypal"
                  ? "Mit PayPal bezahlen"
                  : "Mit Kreditkarte bezahlen"}
            </button>

            <p className="text-[11px] text-slate-500 text-center">
              Durch Klicken auf "Bezahlen" stimmst du unseren{" "}
              <Link to="/terms" className="text-emerald-300 hover:text-emerald-200">
                AGB
              </Link>{" "}
              und{" "}
              <Link to="/privacy" className="text-emerald-300 hover:text-emerald-200">
                Datenschutzbestimmungen
              </Link>{" "}
              zu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalCheckoutPage;

