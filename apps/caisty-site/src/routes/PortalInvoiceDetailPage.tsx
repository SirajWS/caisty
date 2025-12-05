// apps/caisty-site/src/routes/PortalInvoiceDetailPage.tsx

import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchPortalInvoice,
  getPortalInvoiceHtmlUrl,
  type PortalInvoiceDetail,
} from "../lib/portalApi";
import { useTheme } from "../lib/theme";

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
  const { theme } = useTheme();
  const isLight = theme === "light";

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
    return <div className={isLight ? "text-slate-900" : "text-slate-100"}>Keine Rechnungs-ID angegeben.</div>;
  }

  const inv = detail?.invoice;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold ${isLight ? "text-slate-900" : "text-slate-50"}`}>Rechnung</h1>
          <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
            Detailansicht der ausgewählten Rechnung.
          </p>
        </div>
        <Link
          to="/portal/invoices"
          className={`text-sm hover:underline ${isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-300 hover:text-white"}`}
        >
          ← Zurück zur Übersicht
        </Link>
      </div>

      {loading && <div className={isLight ? "text-slate-600" : "text-slate-400"}>Lade…</div>}
      {error && <div className={`text-sm ${isLight ? "text-red-600" : "text-red-400"}`}>{error}</div>}

      {inv && (
        <div className="space-y-4">
          <div className={`rounded-2xl border p-6 ${isLight ? "border-slate-200 bg-white shadow-sm" : "border-slate-800 bg-slate-900/60"}`}>
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <div className={`text-xs uppercase font-semibold tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  RECHNUNGSNUMMER
                </div>
                <div className={`font-mono text-lg font-semibold mt-1 ${isLight ? "text-slate-900" : "text-slate-50"}`}>
                  {inv.number}
                </div>
              </div>
              <div>
                <div className={`text-xs uppercase font-semibold tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  BETRAG
                </div>
                <div className={`text-lg font-semibold mt-1 ${isLight ? "text-slate-900" : "text-slate-50"}`}>
                  {formatAmount(inv.amountCents, inv.currency)}
                </div>
              </div>
              <div>
                <div className={`text-xs uppercase font-semibold tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  STATUS
                </div>
                <div className="mt-1">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${isLight ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            </div>

            <div className={`mt-6 grid gap-4 text-sm sm:grid-cols-2 ${isLight ? "text-slate-700" : "text-slate-200"}`}>
              <div>
                <div className={`text-xs uppercase font-semibold tracking-wider mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  AUSGESTELLT AM
                </div>
                <div className={isLight ? "text-slate-900" : "text-slate-100"}>{formatDate(inv.createdAt)}</div>
              </div>
              <div>
                <div className={`text-xs uppercase font-semibold tracking-wider mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  FÄLLIG AM
                </div>
                <div className={isLight ? "text-slate-900" : "text-slate-100"}>{formatDate(inv.dueAt)}</div>
              </div>
              <div>
                <div className={`text-xs uppercase font-semibold tracking-wider mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  ZEITRAUM
                </div>
                <div className={isLight ? "text-slate-900" : "text-slate-100"}>
                  {formatDate(inv.periodStart)} –{" "}
                  {formatDate(inv.periodEnd)}
                </div>
              </div>
              <div>
                <div className={`text-xs uppercase font-semibold tracking-wider mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  PLAN
                </div>
                <div className={isLight ? "text-slate-900" : "text-slate-100"}>{inv.plan ?? "—"}</div>
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
                className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${isLight ? "border-emerald-600 text-emerald-700 hover:bg-emerald-50" : "border-emerald-400 text-emerald-200 hover:bg-emerald-500/10"}`}
              >
                📄 Rechnung anzeigen
              </button>
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
                    setTimeout(() => {
                      win?.print();
                    }, 500);
                  }
                }}
                className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${isLight ? "border-blue-600 text-blue-700 hover:bg-blue-50" : "border-blue-400 text-blue-200 hover:bg-blue-500/10"}`}
              >
                📥 Als PDF drucken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalInvoiceDetailPage;
