// apps/caisty-site/src/routes/PortalUpgradeResultPage.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

type UpgradeStatus = "success" | "cancelled" | "failed" | "unknown";

const PortalUpgradeResultPage: React.FC = () => {
  const query = useQuery();
  const rawStatus = (query.get("status") || "unknown") as UpgradeStatus;
  const invoiceId = query.get("invoiceId");
  const { language } = useLanguage();
  const u = getPortalTranslations(language).upgradeResult;

  let title: string;
  let message: string;
  let accentText = "text-slate-200";
  let badgeClass =
    "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold";

  switch (rawStatus) {
    case "success":
      title = u.successTitle;
      message = u.successMsg;
      accentText = "text-emerald-400";
      badgeClass +=
        " border-emerald-500/70 bg-emerald-500/10 text-emerald-300";
      break;

    case "cancelled":
      title = u.cancelledTitle;
      message = u.cancelledMsg;
      accentText = "text-amber-300";
      badgeClass += " border-amber-500/70 bg-amber-500/10 text-amber-300";
      break;

    case "failed":
      title = u.failedTitle;
      message = u.failedMsg;
      accentText = "text-rose-400";
      badgeClass += " border-rose-500/70 bg-rose-500/10 text-rose-300";
      break;

    default:
      title = u.unknownTitle;
      message = u.unknownMsg;
      accentText = "text-slate-300";
      badgeClass += " border-slate-600 bg-slate-900 text-slate-200";
      break;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div>
          <span className={badgeClass}>
            {u.statusPrefix}
            <span className="capitalize">{rawStatus}</span>
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className={`text-sm ${accentText}`}>{message}</p>

        {invoiceId && (
          <p className="text-xs text-slate-400">
            {u.refInvoice}{" "}
            <span className="font-mono text-slate-200">{invoiceId}</span>
          </p>
        )}
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs text-slate-300">
        <ol className="list-decimal space-y-1 pl-5">
          <li>{u.hint1}</li>
          <li>{u.hint2}</li>
          <li>{u.hint3}</li>
        </ol>
      </section>

      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        <Link
          to="/portal/licenses"
          className="inline-flex items-center rounded-full bg-orange-500 px-4 py-2 font-semibold text-white shadow-sm hover:bg-orange-600"
        >
          {u.linkLicenses}
        </Link>

        <Link
          to="/portal/invoices"
          className="inline-flex items-center rounded-full border border-slate-600 px-4 py-2 font-semibold text-slate-100 hover:bg-slate-800"
        >
          {u.linkInvoices}
        </Link>

        <Link
          to="/portal/plan"
          className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
        >
          {u.linkPlan}
        </Link>

        <Link
          to="/portal"
          className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900"
        >
          {u.linkDashboard}
        </Link>
      </div>
    </div>
  );
};

export default PortalUpgradeResultPage;
