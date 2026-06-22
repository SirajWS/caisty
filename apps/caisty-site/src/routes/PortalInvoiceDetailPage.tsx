// apps/caisty-site/src/routes/PortalInvoiceDetailPage.tsx

import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchPortalInvoice,
  fetchPortalInvoiceHtml,
  type PortalInvoiceDetail,
} from "../lib/portalApi";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalMutedLink, portalSecondaryCta } from "../lib/portalUi";

const PortalInvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = React.useState<PortalInvoiceDetail | null>(null);
  const [invoiceHtml, setInvoiceHtml] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const isLight = theme === "light";

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, html] = await Promise.all([
          fetchPortalInvoice(id),
          fetchPortalInvoiceHtml(id),
        ]);
        if (!cancelled) {
          setDetail(data);
          setInvoiceHtml(html);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : getPortalTranslations(language).invoiceDetail.errorLoad,
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

  function handlePrint() {
    if (!invoiceHtml) return;
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    win.document.write(invoiceHtml);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 300);
  }

  if (!id) {
    return (
      <div className={isLight ? "text-slate-900" : "text-slate-100"}>
        {t.invoiceDetail.noId}
      </div>
    );
  }

  const inv = detail?.invoice;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-semibold tracking-tight ${isLight ? "text-[#0B1220]" : "text-white"}`}
          >
            {t.invoiceDetail.title}
            {inv ? ` ${inv.number}` : ""}
          </h1>
          <p className={`text-sm mt-1 ${isLight ? "text-slate-600" : "text-slate-300"}`}>
            {t.invoiceDetail.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {invoiceHtml && (
            <button
              type="button"
              onClick={handlePrint}
              className={portalSecondaryCta(isLight)}
            >
              📥 {t.invoiceDetail.printPdf}
            </button>
          )}
          <Link
            to="/portal/invoices"
            className={`text-sm no-underline ${portalMutedLink(isLight)}`}
          >
            {t.invoiceDetail.backList}
          </Link>
        </div>
      </div>

      {loading && (
        <div className={isLight ? "text-slate-600" : "text-slate-400"}>
          {t.invoiceDetail.loading}
        </div>
      )}
      {error && (
        <div className={`text-sm ${isLight ? "text-red-600" : "text-red-400"}`}>
          {error}
        </div>
      )}

      {invoiceHtml && (
        <div
          className={`overflow-hidden rounded-2xl border shadow-sm ${isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-white"}`}
        >
          <iframe
            title={`${t.invoiceDetail.title} ${inv?.number ?? id}`}
            srcDoc={invoiceHtml}
            className="block w-full min-h-[1050px] border-0 bg-white"
            sandbox="allow-same-origin allow-modals"
          />
        </div>
      )}
    </div>
  );
};

export default PortalInvoiceDetailPage;
