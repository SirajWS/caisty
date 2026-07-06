import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import type { PortalInvoice } from "../../lib/portalApi";
import type { PortalTranslations } from "../../lib/translations/portal";
import {
  portalInvoiceStatusBadge,
  portalTableShell,
  portalTextLink,
} from "../../lib/portalUi";

function formatDate(value: string | null, locale: string, dash: string): string {
  if (!value) return dash;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(locale);
}

function formatAmount(inv: PortalInvoice, locale: string): string {
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

export function InvoicesTable({
  items,
  loading,
  error,
  isLight,
  locale,
  t,
  emptyCtaHref = "/portal/billing#billing-plans",
}: {
  items: PortalInvoice[];
  loading: boolean;
  error: string | null;
  isLight: boolean;
  locale: string;
  t: PortalTranslations;
  emptyCtaHref?: string;
}) {
  if (loading) {
    return <div className={isLight ? "text-slate-600" : "text-slate-400"}>{t.invoices.loading}</div>;
  }

  if (error) {
    return <div className={`text-sm ${isLight ? "text-red-600" : "text-red-400"}`}>{error}</div>;
  }

  if (items.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl border px-4 py-10 text-center ${
          isLight ? "border-gray-200 bg-white" : "border-white/10 bg-white/[0.04]"
        }`}
      >
        <FileText
          className={`mb-3 h-8 w-8 ${isLight ? "text-slate-400" : "text-slate-500"}`}
          strokeWidth={1.25}
          aria-hidden
        />
        <h3 className={`text-base font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>
          {t.invoices.emptyTitle}
        </h3>
        <p
          className={`mt-2 max-w-md text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}
        >
          {t.invoices.emptyDescription}
        </p>
        <Link
          to={emptyCtaHref}
          className={`mt-6 text-sm font-medium no-underline ${portalTextLink(isLight)}`}
        >
          {t.invoices.emptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div className={portalTableShell(isLight)}>
      <table className="portal-table">
        <thead>
          <tr>
            <th>{t.labels.number}</th>
            <th>{t.labels.period}</th>
            <th className="text-right">{t.labels.amount}</th>
            <th>{t.labels.status}</th>
            <th>{t.labels.createdAt}</th>
            <th aria-label={t.invoices.details} />
          </tr>
        </thead>
        <tbody>
          {items.map((inv) => (
            <tr key={inv.id}>
              <td
                className={`font-mono text-xs font-medium ${isLight ? "text-slate-900" : "text-slate-100"}`}
              >
                {inv.number}
              </td>
              <td className={`text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                {inv.periodStart || inv.periodEnd
                  ? `${formatDate(inv.periodStart, locale, t.labels.dash)} – ${formatDate(inv.periodEnd, locale, t.labels.dash)}`
                  : (inv.billingPeriodLabel ??
                    (inv.billingPeriod === "yearly"
                      ? t.labels.yearly
                      : inv.billingPeriod === "monthly"
                        ? t.labels.monthly
                        : t.labels.dash))}
              </td>
              <td
                className={`text-right text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}
              >
                {formatAmount(inv, locale)}
              </td>
              <td>
                <span className={portalInvoiceStatusBadge(inv.status, isLight)}>{inv.status}</span>
              </td>
              <td className={`text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                {formatDate(inv.createdAt, locale, t.labels.dash)}
              </td>
              <td className="portal-table-actions text-right">
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
  );
}
