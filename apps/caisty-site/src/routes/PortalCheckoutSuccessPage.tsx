// apps/caisty-site/src/routes/PortalCheckoutSuccessPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getStoredPortalToken } from "../lib/portalApi";

export default function PortalCheckoutSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token"); // PayPal order ID
    const sessionId = searchParams.get("session_id"); // Stripe session ID
    const invoiceId = searchParams.get("invoiceId"); // Invoice ID from URL (optional)

    // Determine provider based on which parameter is present
    const provider = sessionId ? "stripe" : token ? "paypal" : null;

    if (!provider) {
      setError("Fehlender Zahlungstoken. Bitte kontaktiere den Support.");
      setStatus("error");
      return;
    }

    async function capturePayment() {
      const portalToken = getStoredPortalToken();
      if (!portalToken) {
        setError("Nicht angemeldet. Bitte melde dich erneut an.");
        navigate("/login");
        return;
      }

      const API_BASE = import.meta.env.VITE_CLOUD_API_URL || 
        (import.meta.env.DEV ? "http://localhost:3333" : "https://api.caisty.com");

      try {
        // invoiceId is optional - backend will extract it from provider metadata
        const captureRes = await fetch(`${API_BASE}/api/billing/capture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${portalToken}`,
          },
          body: JSON.stringify({
            ...(provider === "stripe" ? { sessionId } : { orderId: token }),
            invoiceId: invoiceId || undefined, // Optional fallback
            provider, // Explicit provider
          }),
        });

        if (captureRes.status === 401) {
          setError("Nicht angemeldet. Bitte melde dich erneut an.");
          navigate("/login");
          return;
        }

        const captureData = await captureRes.json();

        if (!captureRes.ok || !captureData.ok) {
          throw new Error(captureData.message ?? "Zahlung konnte nicht verarbeitet werden.");
        }

        // Success - clear pending invoice
        sessionStorage.removeItem("pendingInvoiceId");
        setStatus("success");

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/portal", { replace: true });
        }, 2000);
      } catch (err: any) {
        console.error("Capture failed", err);
        setError(err?.message ?? "Zahlung konnte nicht verarbeitet werden.");
        setStatus("error");
      }
    }

    capturePayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="rounded-xl border border-slate-700 bg-slate-900 px-8 py-6 shadow-lg max-w-md w-full">
        {status === "processing" && (
          <>
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">
              Zahlung wird verarbeitet...
            </h2>
            <p className="text-sm text-slate-400 text-center">
              Bitte warte einen Moment, während wir deine Zahlung bestätigen.
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
              Zahlung erfolgreich!
            </h2>
            <p className="text-sm text-slate-400 text-center mb-4">
              Deine Zahlung wurde erfolgreich verarbeitet. Du wirst gleich zum Dashboard weitergeleitet.
            </p>
            <p className="text-xs text-slate-500 text-center">
              Deine Lizenz und Rechnung wurden erstellt.
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
              Fehler bei der Zahlung
            </h2>
            <p className="text-sm text-slate-400 text-center mb-4">
              {error || "Die Zahlung konnte nicht verarbeitet werden."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/portal/plan")}
                className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Zurück zu Plänen
              </button>
              <button
                onClick={() => navigate("/portal")}
                className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                Zum Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

