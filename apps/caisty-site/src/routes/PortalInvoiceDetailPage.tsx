// apps/caisty-site/src/routes/PortalInvoiceDetailPage.tsx

import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchPortalInvoice,
  getPortalInvoiceHtmlUrl,
  type PortalInvoiceDetail,
} from "../lib/portalApi";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { portalCardShell, portalInvoiceStatusBadge, portalMutedLink, portalSecondaryCta } from "../lib/portalUi";

const PortalInvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = React.useState<PortalInvoiceDetail | null>(
    null,
  );
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

  function formatAmount(cents: number, currency: string): string {
    if (!cents || Number.isNaN(cents)) {
      try {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency: currency || "EUR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(0);
      } catch {
        return `0.00 ${currency ?? "EUR"}`;
      }
    }
    const amount = cents / 100;
    if (Number.isNaN(amount)) {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency || "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(0);
    }
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency || "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency ?? ""}`.trim();
    }
  }

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPortalInvoice(id);
        if (!cancelled) setDetail(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : getPortalTranslations(language).invoiceDetail.errorLoad,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, language]);

  if (!id) {
    return <div className={isLight ? "text-slate-900" : "text-slate-100"}>{t.invoiceDetail.noId}</div>;
  }

  const inv = detail?.invoice;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-semibold tracking-tight ${isLight ? "text-[#0B1220]" : "text-white"}`}>{t.invoiceDetail.title}</h1>
          <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
            {t.invoiceDetail.subtitle}
          </p>
        </div>
        <Link
          to="/portal/invoices"
          className={`text-sm no-underline ${portalMutedLink(isLight)}`}
        >
          {t.invoiceDetail.backList}
        </Link>
      </div>

      {loading && <div className={isLight ? "text-slate-600" : "text-slate-400"}>{t.invoiceDetail.loading}</div>}
      {error && <div className={`text-sm ${isLight ? "text-red-600" : "text-red-400"}`}>{error}</div>}

      {inv && (
        <div className="space-y-4">
          <div className={portalCardShell(isLight)}>
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <div className={`text-xs uppercase font-semibold tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {t.invoiceDetail.invoiceNumber}
                </div>
                <div className={`font-mono text-lg font-semibold mt-1 ${isLight ? "text-slate-900" : "text-slate-50"}`}>
                  {inv.number}
                </div>
              </div>
              <div>
                <div className={`text-xs uppercase font-semibold tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {t.invoiceDetail.amount}
                </div>
                <div className={`text-lg font-semibold mt-1 ${isLight ? "text-slate-900" : "text-slate-50"}`}>
                  {formatAmount(inv.amountCents, inv.currency)}
                </div>
                {inv.amountBreakdown ? (
                  <dl className={`mt-3 space-y-2 text-sm border-t pt-3 ${isLight ? "border-slate-200 text-slate-700" : "border-slate-600 text-slate-300"}`}>
                    <div className="flex justify-between gap-4">
                      <dt>{t.labels.subtotal}</dt>
                      <dd className="tabular-nums">{formatAmount(inv.amountBreakdown.netCents, inv.currency)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>
                        {t.invoiceDetail.vatWithPercent.replace(
                          /\{\{pct\}\}/g,
                          String(inv.amountBreakdown.vatRatePercent),
                        )}
                      </dt>
                      <dd className="tabular-nums">{formatAmount(inv.amountBreakdown.taxCents, inv.currency)}</dd>
                    </div>
                    <p className={`text-xs mt-2 ${isLight ? "text-slate-500" : "text-slate-400"}`}>{t.labels.incVat}</p>
                  </dl>
                ) : null}
              </div>
              <div>
                <div className={`text-xs uppercase font-semibold tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {t.invoiceDetail.status}
                </div>
                <div className="mt-1">
                  <span className={portalInvoiceStatusBadge(inv.status, isLight)}>
                    {inv.status}
                  </span>
                </div>
              </div>
            </div>

            <div className={`mt-6 grid gap-4 text-sm sm:grid-cols-2 ${isLight ? "text-slate-700" : "text-slate-200"}`}>
              <div>
                <div className={`text-xs uppercase font-semibold tracking-wider mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {t.invoiceDetail.issuedAt}
                </div>
                <div className={isLight ? "text-slate-900" : "text-slate-100"}>{formatDate(inv.createdAt)}</div>
              </div>
              <div>
                <div className={`text-xs uppercase font-semibold tracking-wider mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {t.invoiceDetail.dueAt}
                </div>
                <div className={isLight ? "text-slate-900" : "text-slate-100"}>{formatDate(inv.dueAt)}</div>
              </div>
              <div>
                <div className={`text-xs uppercase font-semibold tracking-wider mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {t.invoiceDetail.period}
                </div>
                <div className={isLight ? "text-slate-900" : "text-slate-100"}>
                  {inv.periodStart || inv.periodEnd
                    ? `${formatDate(inv.periodStart)} – ${formatDate(inv.periodEnd)}`
                    : inv.billingPeriodLabel ??
                      (inv.billingPeriod === "yearly"
                        ? t.labels.yearly
                        : inv.billingPeriod === "monthly"
                          ? t.labels.monthly
                          : t.labels.dash)}
                </div>
              </div>
              <div>
                <div className={`text-xs uppercase font-semibold tracking-wider mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {t.invoiceDetail.plan}
                </div>
                <div className={isLight ? "text-slate-900" : "text-slate-100"}>{inv.plan ?? t.labels.dash}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={async () => {
                  const token = localStorage.getItem("caisty.portal.token");
                  if (!token) {
                    alert(t.invoiceDetail.notSignedIn);
                    return;
                  }
                  const url = getPortalInvoiceHtmlUrl(inv.id);
                  const res = await fetch(url, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  });
                  if (!res.ok) {
                    alert(`${t.invoiceDetail.errorPrefix} ${res.status}`);
                    return;
                  }
                  const html = await res.text();
                  const win = window.open();
                  if (win) {
                    win.document.write(html);
                    win.document.close();
                  }
                }}
                className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${isLight ? "border-orange-600 text-orange-700 hover:bg-orange-50" : "border-orange-400 text-orange-200 hover:bg-orange-500/10"}`}
              >
                📄 {t.invoiceDetail.viewInvoice}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const token = localStorage.getItem("caisty.portal.token");
                  if (!token) {
                    alert(t.invoiceDetail.notSignedIn);
                    return;
                  }
                  const url = getPortalInvoiceHtmlUrl(inv.id);
                  const res = await fetch(url, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  });
                  if (!res.ok) {
                    alert(`${t.invoiceDetail.errorPrefix} ${res.status}`);
                    return;
                  }
                  const html = await res.text();
                  const win = window.open();
                  if (win) {
                    win.document.write(html);
                    win.document.close();
                    setTimeout(() => {
                      win?.print();
                    }, 500);
                  }
                }}
                className={portalSecondaryCta(isLight)}
              >
                📥 {t.invoiceDetail.printPdf}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalInvoiceDetailPage;
