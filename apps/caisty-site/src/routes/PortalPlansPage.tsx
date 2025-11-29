// apps/caisty-site/src/routes/PortalPlansPage.tsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  createTrialLicense,
  startPortalUpgrade,
  type PortalLicense,
} from "../lib/portalApi";
import { usePortalOutlet } from "./PortalLayout";

const PortalPlansPage: React.FC = () => {
  const { customer } = usePortalOutlet();
  const navigate = useNavigate();

  const [currentLicense, setCurrentLicense] = React.useState<PortalLicense | null>(null);
  const [busyTrial, setBusyTrial] = React.useState(false);
  const [busyPlan, setBusyPlan] = React.useState<"starter" | "pro" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // ... dein bestehender Code, der currentLicense ermittelt ...

  async function handleUpgrade(plan: "starter" | "pro") {
    try {
      setError(null);
      setBusyPlan(plan);

      const res = await startPortalUpgrade(plan);

      if (res.redirectUrl) {
        // direkt ins PayPal-Checkout
        window.location.href = res.redirectUrl;
        return;
      }

      // Fallback: ohne externen Checkout, direkt ins Rechnungs-Tab
      navigate("/portal/invoices", {
        state: {
          flash: {
            type: "success",
            message: `Upgrade auf ${plan} gestartet. Die Rechnung wurde erstellt.`,
          },
        },
      });
    } catch (err: any) {
      console.error("Upgrade failed", err);
      setError(err?.message ?? "Upgrade konnte nicht gestartet werden.");
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* ... dein Header etc ... */}

      {error && (
        <div className="rounded-lg border border-red-700 bg-red-900/40 px-3 py-2 text-xs text-red-100">
          {error}
        </div>
      )}

      {/* Karten für Trial, Starter, Pro – nur die Buttons interessant */}

      {/* Starter-Card – Beispiel-Button */}
      <button
        type="button"
        onClick={() => handleUpgrade("starter")}
        disabled={busyPlan === "starter"}
        className="mt-3 inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {busyPlan === "starter" ? "Weiterleitung zu PayPal…" : "Plan wählen"}
      </button>

      {/* Pro analog:
      <button onClick={() => handleUpgrade("pro")} ...> */}
    </div>
  );
};

export default PortalPlansPage;
