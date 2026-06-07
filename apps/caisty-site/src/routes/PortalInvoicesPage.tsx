// apps/caisty-site/src/routes/PortalInvoicesPage.tsx

import React from "react";
import { Link } from "react-router-dom";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl sm:text-4xl font-semibold tracking-tight ${isLight ? "text-[#0B1220]" : "text-white"}`}>{t.invoices.title}</h1>
          <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
            {t.invoices.subtitle}
          </p>
        </div>
        <Link
          to="/portal"
          className={`text-sm no-underline ${portalMutedLink(isLight)}`}
        >
          {t.invoices.backDashboard}
        </Link>
      </div>

      {loading && <div className={isLight ? "text-slate-600" : "text-slate-400"}>{t.invoices.loading}</div>}
      {error && <div className={`text-sm ${isLight ? "text-red-600" : "text-red-400"}`}>{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
          {t.invoices.empty}
        </div>
      )}

      {items.length > 0 && (
        <div className={portalTableShell(isLight)}>
          <table className="min-w-full text-sm">
            <thead>
              <tr className={`border-b ${isLight ? "border-slate-200 bg-slate-50" : "border-white/[0.08] bg-[#0f172a]"}`}>
                <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  {t.labels.number}
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  {t.labels.period}
                </th>
                <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  {t.labels.amount}
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  {t.labels.status}
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  {t.labels.createdAt}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? "divide-slate-100" : "divide-slate-800"}`}>
              {items.map((inv) => (
                <tr
                  key={inv.id}
                  className={`transition-colors ${isLight ? "bg-white hover:bg-slate-50" : "bg-[#111827] hover:bg-[#0f172a]"}`}
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
