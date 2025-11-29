// apps/caisty-site/src/routes/PortalUpgradeResultPage.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const PortalUpgradeResultPage: React.FC = () => {
  const query = useQuery();
  const status = (query.get("status") || "unknown") as
    | "success"
    | "cancelled"
    | "failed"
    | "unknown";

  let title = "Upgrade";
  let message =
    "Der Status der Zahlung konnte nicht eindeutig bestimmt werden.";
  let accent = "text-slate-200";

  if (status === "success") {
    title = "Danke für deine Zahlung!";
    message =
      "Deine Zahlung bei PayPal wurde erfolgreich abgeschlossen. Deine Lizenz wurde im Hintergrund aktualisiert. Du findest deine Lizenz unter „Lizenzen“ und die zugehörige Rechnung unter „Rechnungen“.";
    accent = "text-emerald-400";
  } else if (status === "cancelled") {
    title = "Zahlung abgebrochen";
    message =
      "Du hast die Zahlung bei PayPal abgebrochen. Dein bisheriger Plan bleibt unverändert. Du kannst das Upgrade jederzeit erneut starten.";
    accent = "text-yellow-300";
  } else if (status === "failed") {
    title = "Zahlung fehlgeschlagen";
    message =
      "Bei der Verarbeitung der Zahlung ist ein Fehler aufgetreten. Bitte versuche es später erneut oder wende dich an den Support.";
    accent = "text-red-400";
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className={`text-sm ${accent}`}>{message}</p>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link
          to="/portal/licenses"
          className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Lizenzen ansehen
        </Link>
        <Link
          to="/portal/invoices"
          className="inline-flex items-center rounded-full border border-slate-600 px-4 py-2 font-semibold text-slate-100 hover:bg-slate-800"
        >
          Rechnungen öffnen
        </Link>
        <Link
          to="/portal/plan"
          className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
        >
          Zurück zu den Plänen
        </Link>
      </div>
    </div>
  );
};

export default PortalUpgradeResultPage;
