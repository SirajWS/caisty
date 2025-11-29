// apps/caisty-site/src/routes/PortalUpgradeResultPage.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

type UpgradeStatus = "success" | "cancelled" | "failed" | "unknown";

const PortalUpgradeResultPage: React.FC = () => {
  const query = useQuery();
  const rawStatus = (query.get("status") || "unknown") as UpgradeStatus;
  const invoiceId = query.get("invoiceId");

  let title: string;
  let message: string;
  let accentText = "text-slate-200";
  let badgeClass =
    "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold";

  switch (rawStatus) {
    case "success":
      title = "Danke für deine Zahlung!";
      message =
        "Deine Zahlung bei PayPal wurde erfolgreich abgeschlossen. Deine Subscription wurde aktiviert und deine Lizenz im Hintergrund aktualisiert. Du findest die Lizenz unter „Lizenzen“ und die zugehörige Rechnung unter „Rechnungen“.";
      accentText = "text-emerald-400";
      badgeClass +=
        " border-emerald-500/70 bg-emerald-500/10 text-emerald-300";
      break;

    case "cancelled":
      title = "Zahlung abgebrochen";
      message =
        "Du hast die Zahlung bei PayPal abgebrochen. Dein bisheriger Plan bleibt unverändert. Du kannst das Upgrade jederzeit erneut über „Plan & Abrechnung“ starten.";
      accentText = "text-amber-300";
      badgeClass += " border-amber-500/70 bg-amber-500/10 text-amber-300";
      break;

    case "failed":
      title = "Zahlung fehlgeschlagen";
      message =
        "Bei der Verarbeitung der Zahlung ist ein Fehler aufgetreten. Die Rechnung bleibt vorerst offen. Bitte versuche es später erneut oder kontaktiere den Caisty-Support.";
      accentText = "text-rose-400";
      badgeClass += " border-rose-500/70 bg-rose-500/10 text-rose-300";
      break;

    default:
      title = "Upgrade-Status unbekannt";
      message =
        "Der Status deiner Zahlung konnte nicht eindeutig bestimmt werden. Prüfe bitte deine Rechnungen und Lizenzen im Portal oder wende dich an den Support.";
      accentText = "text-slate-300";
      badgeClass += " border-slate-600 bg-slate-900 text-slate-200";
      break;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div>
          <span className={badgeClass}>
            Status:&nbsp;
            <span className="capitalize">{rawStatus}</span>
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className={`text-sm ${accentText}`}>{message}</p>

        {invoiceId && (
          <p className="text-xs text-slate-400">
            Referenz-Rechnung:&nbsp;
            <span className="font-mono text-slate-200">{invoiceId}</span>
          </p>
        )}
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs text-slate-300">
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Unter <span className="font-semibold">„Rechnungen“</span> kannst du
            den genauen Zahlungsstatus einsehen.
          </li>
          <li>
            Unter <span className="font-semibold">„Lizenzen“</span> findest du
            deinen aktuellen Lizenzschlüssel (Starter / Pro).
          </li>
          <li>
            Bei Unklarheiten kannst du jederzeit den{" "}
            <span className="font-semibold">Support</span> im Portal
            kontaktieren.
          </li>
        </ol>
      </section>

      <div className="mt-2 flex flex-wrap gap-3 text-sm">
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
          Zurück zu „Plan &amp; Abrechnung“
        </Link>

        <Link
          to="/portal"
          className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
        >
          Zurück zum Dashboard
        </Link>
      </div>
    </div>
  );
};

export default PortalUpgradeResultPage;
