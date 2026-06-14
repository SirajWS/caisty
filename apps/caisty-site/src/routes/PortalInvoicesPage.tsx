// apps/caisty-site/src/routes/PortalInvoicesPage.tsx

import React from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import {
  fetchPortalInvoices,
  type PortalInvoice,
} from "../lib/portalApi";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { portalInvoiceStatusBadge, portalMutedLink, portalTableShell, portalTextLink } from "../lib/portalUi";

const PortalInvoicesPage: React.FC = () => {
  const [items, setItems] = React.useState<PortalInvoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const locale = portalLocaleTag(language);
  const isLight = theme === "light";

  function formatDate(value: string | null): string {
    if (!value) return t.labels.dash;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(locale);
  }

  function formatAmount(inv: PortalInvoice): string {
    if (!inv.amountCents || Number.isNaN(inv.amountCents)) {
      try {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency: inv.currency || "EUR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(0);
      } catch {
        return `0.00 ${inv.currency ?? "EUR"}`;
      }
    }
    const amount = inv.amountCents / 100;
    if (Number.isNaN(amount)) {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: inv.currency || "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(0);
    }
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: inv.currency || "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${inv.currency ?? ""}`.trim();
    }
  }

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPortalInvoices();
        if (!cancelled) setItems(data ?? []);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : getPortalTranslations(language).invoices.errorLoad,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [language]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <header className="space-y-2">
          <h1 className={`text-2xl sm:text-3xl font-semibold tracking-tight ${isLight ? "text-[#0B1220]" : "text-white"}`}>{t.invoices.title}</h1>
          <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            {t.invoices.subtitle}
          </p>
        </header>
        <Link
          to="/portal"
          className={`text-sm no-underline shrink-0 ${portalMutedLink(isLight)}`}
        >
          {t.invoices.backDashboard}
        </Link>
      </div>

      {loading && <div className={isLight ? "text-slate-600" : "text-slate-400"}>{t.invoices.loading}</div>}
      {error && <div className={`text-sm ${isLight ? "text-red-600" : "text-red-400"}`}>{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div
          className={`flex flex-col items-center justify-center rounded-xl border px-6 py-16 text-center ${
            isLight ? "border-gray-200 bg-white" : "border-white/10 bg-white/[0.04]"
          }`}
        >
          <FileText className={`mb-4 h-10 w-10 ${isLight ? "text-slate-400" : "text-slate-500"}`} strokeWidth={1.25} aria-hidden />
          <h2 className={`text-base font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{t.invoices.emptyTitle}</h2>
          <p className={`mt-2 max-w-md text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            {t.invoices.emptyDescription}
          </p>
          <Link
            to="/portal/plan"
            className={`mt-6 text-sm font-medium no-underline ${portalTextLink(isLight)}`}
          >
            {t.invoices.emptyCta}
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className={portalTableShell(isLight)}>
          <table className="min-w-full text-sm">
            <thead>
              <tr className={`border-b text-left text-xs font-semibold uppercase tracking-wider ${isLight ? "border-slate-100 bg-slate-50/80 text-slate-500" : "border-white/10 bg-white/[0.03] text-slate-400"}`}>
                <th className="px-4 py-3.5">
                  {t.labels.number}
                </th>
                <th className="px-4 py-3.5">
                  {t.labels.period}
                </th>
                <th className="px-4 py-3.5 text-right">
                  {t.labels.amount}
                </th>
                <th className="px-4 py-3.5">
                  {t.labels.status}
                </th>
                <th className="px-4 py-3.5">
                  {t.labels.createdAt}
                </th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className={isLight ? "divide-y divide-slate-100" : "divide-y divide-white/10"}>
              {items.map((inv) => (
                <tr
                  key={inv.id}
                  className={`transition-colors ${isLight ? "hover:bg-slate-50/80" : "hover:bg-white/[0.04]"}`}
                >
                  <td className={`px-4 py-3 font-mono text-xs font-medium ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                    {inv.number}
                  </td>
                  <td className={`px-4 py-3 text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                    {inv.periodStart || inv.periodEnd
                      ? `${formatDate(inv.periodStart)} – ${formatDate(
                          inv.periodEnd,
                        )}`
                      : t.labels.dash}
                  </td>
                  <td className={`px-4 py-3 text-right text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                    {formatAmount(inv)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={portalInvoiceStatusBadge(inv.status, isLight)}>{inv.status}</span>
                  </td>
                  <td className={`px-4 py-3 text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                    {formatDate(inv.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/portal/invoices/${inv.id}`}
                      className={`text-xs font-medium no-underline hover:underline ${portalTextLink(isLight)}`}
                    >
                      {t.invoices.details}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PortalInvoicesPage;
