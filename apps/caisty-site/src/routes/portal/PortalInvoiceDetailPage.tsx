// apps/caisty-site/src/portal/PortalInvoiceDetailPage.tsx

import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchPortalInvoice,
  getPortalInvoiceHtmlUrl,
  type PortalInvoiceDetail,
} from "../lib/portalApi";

const formatMoney = (cents: number, currency: string) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(cents / 100);

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("de-DE") : "—";

const PortalInvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = React.useState<PortalInvoiceDetail | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPortalInvoice(id);
        if (!cancelled) setDetail(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Fehler beim Laden");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return <div>Keine Rechnungs-ID angegeben.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Rechnung</h1>
          <p className="text-sm text-slate-300">
            Detailansicht der ausgewählten Rechnung.
          </p>
        </div>
        <Link
          to="/portal/invoices"
          className="text-sm text-slate-300 hover:text-white"
        >
          ← Zurück zur Übersicht
        </Link>
      </div>

      {loading && <div>Lade…</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}

      {detail && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <div className="text-xs uppercase text-slate-400">
                  Rechnungsnummer
                </div>
                <div className="font-mono text-lg text-slate-50">
                  {detail.invoice.number}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400">
                  Betrag
                </div>
                <div className="text-lg text-slate-50">
                  {formatMoney(
                    detail.invoice.amountCents,
                    detail.invoice.currency,
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400">
                  Status
                </div>
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-emerald-900/60 text-emerald-300">
                  {detail.invoice.status}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase text-slate-400">
                  Ausgestellt am
                </div>
                <div>{formatDate(detail.invoice.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400">
                  Fällig am
                </div>
                <div>{formatDate(detail.invoice.dueAt)}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400">
                  Zeitraum
                </div>
                <div>
                  {formatDate(detail.invoice.periodStart)} –{" "}
                  {formatDate(detail.invoice.periodEnd)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400">
                  Plan
                </div>
                <div>{detail.invoice.plan ?? "—"}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={getPortalInvoiceHtmlUrl(detail.invoice.id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-emerald-400 px-4 py-1.5 text-sm font-medium text-emerald-200 hover:bg-emerald-500/10"
              >
                Rechnung anzeigen / drucken
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalInvoiceDetailPage;
