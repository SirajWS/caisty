// apps/caisty-site/src/routes/PortalCheckoutCancelPage.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PortalCheckoutCancelPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear pending invoice
    sessionStorage.removeItem("pendingInvoiceId");
    
    // Redirect to plan page after 2 seconds
    const timer = setTimeout(() => {
      navigate("/portal/plan", { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="rounded-xl border border-slate-700 bg-slate-900 px-8 py-6 shadow-lg max-w-md w-full">
        <div className="flex items-center justify-center mb-4">
          <div className="rounded-full bg-yellow-500/20 p-3">
            <svg
              className="w-12 h-12 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-center mb-2 text-yellow-400">
          Zahlung abgebrochen
        </h2>
        <p className="text-sm text-slate-400 text-center mb-4">
          Die Zahlung wurde abgebrochen. Du wirst gleich zurück zu den Plänen weitergeleitet.
        </p>
        <button
          onClick={() => navigate("/portal/plan")}
          className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
        >
          Zu den Plänen
        </button>
      </div>
    </div>
  );
}

