// apps/caisty-site/src/routes/PortalCheckoutSuccessPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getStoredPortalToken } from "../lib/portalApi";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";

export default function PortalCheckoutSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tc = getPortalTranslations(language).checkoutSuccess;
    const token = searchParams.get("token");
    const sessionId = searchParams.get("session_id");
    const invoiceId = searchParams.get("invoiceId");

    const provider = sessionId ? "stripe" : token ? "paypal" : null;

    if (!provider) {
      setError(tc.missingToken);
      setStatus("error");
      return;
    }

    async function capturePayment() {
      const portalToken = getStoredPortalToken();
      if (!portalToken) {
        setError(tc.notSignedIn);
        navigate("/login");
        return;
      }

      const API_BASE = import.meta.env.VITE_CLOUD_API_URL ||
        (import.meta.env.DEV ? "http://localhost:3333" : "https://api.caisty.com");

      try {
        const captureRes = await fetch(`${API_BASE}/api/billing/capture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${portalToken}`,
          },
          body: JSON.stringify({
            ...(provider === "stripe" ? { sessionId } : { orderId: token }),
            invoiceId: invoiceId || undefined,
            provider,
          }),
        });

        if (captureRes.status === 401) {
          setError(tc.notSignedIn);
          navigate("/login");
          return;
        }

        const captureData = await captureRes.json();

        if (!captureRes.ok || !captureData.ok) {
          throw new Error(captureData.message ?? tc.captureFailed);
        }

        sessionStorage.removeItem("pendingInvoiceId");
        setStatus("success");

        setTimeout(() => {
          navigate("/portal", { replace: true });
        }, 2000);
      } catch (err: unknown) {
        console.error("Capture failed", err);
        setError(
          err instanceof Error ? err.message : tc.captureFailed,
        );
        setStatus("error");
      }
    }

    capturePayment();
  }, [searchParams, navigate, language]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1220] text-slate-100 px-4">
      <div className="rounded-[22px] border border-white/[0.08] bg-[#111827] px-8 py-8 shadow-xl max-w-md w-full">
        {status === "processing" && (
          <>
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-orange-500 border-t-transparent" />
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">
              {t.checkoutSuccess.processingTitle}
            </h2>
            <p className="text-sm text-slate-400 text-center">
              {t.checkoutSuccess.processingBody}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-emerald-500/20 p-3">
                <svg
                  className="w-12 h-12 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-center mb-2 text-emerald-400">
              {t.checkoutSuccess.successTitle}
            </h2>
            <p className="text-sm text-slate-400 text-center mb-4">
              {t.checkoutSuccess.successBody}
            </p>
            <p className="text-xs text-slate-500 text-center">
              {t.checkoutSuccess.successNote}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-red-500/20 p-3">
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-center mb-2 text-red-400">
              {t.checkoutSuccess.errorTitle}
            </h2>
            <p className="text-sm text-slate-400 text-center mb-4">
              {error || t.checkoutSuccess.errorGeneric}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/portal/billing")}
                className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                {t.checkoutSuccess.backPlans}
              </button>
              <button
                type="button"
                onClick={() => navigate("/portal")}
                className="flex-1 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                {t.checkoutSuccess.toDashboard}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
