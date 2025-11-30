// apps/caisty-site/src/routes/PortalInvoiceDetailPage.tsx

import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchPortalInvoice,
  getPortalInvoiceHtmlUrl,
  type PortalInvoiceDetail,
} from "../lib/portalApi";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("de-DE");
}

function formatAmount(cents: number, currency: string): string {
  if (!cents || Number.isNaN(cents)) {
    return "0,00 €";
  }
  const amount = cents / 100;
  if (Number.isNaN(amount)) {
    return "0,00 €";
  }
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency ?? ""}`.trim();
  }
}

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
        if (!cancelled) {
          setError(err.message ?? "Fehler beim Laden der Rechnung.");
        }
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

  const inv = detail?.invoice;

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
      {error && <div className="text-sm text-red-400">{error}</div>}

      {inv && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <div className="text-xs uppercase text-slate-400">
                  Rechnungsnummer
                </div>
                <div className="font-mono text-lg text-slate-50">
                  {inv.number}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400">
                  Betrag
                </div>
                <div className="text-lg text-slate-50">
                  {formatAmount(inv.amountCents, inv.currency)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400">
                  Status
                </div>
                <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                  {inv.status}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase text-slate-400">
                  Ausgestellt am
                </div>
                <div>{formatDate(inv.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400">
                  Fällig am
                </div>
                <div>{formatDate(inv.dueAt)}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400">
                  Zeitraum
                </div>
                <div>
                  {formatDate(inv.periodStart)} –{" "}
                  {formatDate(inv.periodEnd)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400">
                  Plan
                </div>
                <div>{inv.plan ?? "—"}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={async () => {
                  const token = localStorage.getItem("caisty.portal.token");
                  if (!token) {
                    alert("Nicht angemeldet");
                    return;
                  }
                  const url = getPortalInvoiceHtmlUrl(inv.id);
                  const res = await fetch(url, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  });
                  if (!res.ok) {
                    alert(`Fehler: ${res.status}`);
                    return;
                  }
                  const html = await res.text();
                  const win = window.open();
                  if (win) {
                    win.document.write(html);
                    win.document.close();
                  }
                }}
                className="inline-flex items-center justify-center rounded-full border border-emerald-400 px-4 py-1.5 text-sm font-medium text-emerald-200 hover:bg-emerald-500/10 cursor-pointer"
              >
                Rechnung anzeigen / drucken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalInvoiceDetailPage;
