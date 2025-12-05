// apps/caisty-site/src/routes/PortalInvoicesPage.tsx

import React from "react";
import { Link } from "react-router-dom";
import {
  fetchPortalInvoices,
  type PortalInvoice,
} from "../lib/portalApi";
import { useTheme } from "../lib/theme";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("de-DE");
}

function formatAmount(inv: PortalInvoice): string {
  if (!inv.amountCents || Number.isNaN(inv.amountCents)) {
    return "0,00 €";
  }
  const amount = inv.amountCents / 100;
  if (Number.isNaN(amount)) {
    return "0,00 €";
  }
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: inv.currency || "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${inv.currency ?? ""}`.trim();
  }
}

const PortalInvoicesPage: React.FC = () => {
  const [items, setItems] = React.useState<PortalInvoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { theme } = useTheme();
  const isLight = theme === "light";

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPortalInvoices();
        if (!cancelled) setItems(data ?? []);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Fehler beim Laden der Rechnungen.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold ${isLight ? "text-slate-900" : "text-slate-50"}`}>Rechnungen</h1>
          <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
            Übersicht über deine Abrechnungen und Zahlungsstatus.
          </p>
        </div>
        <Link
          to="/portal"
          className={`text-sm hover:underline ${isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-300 hover:text-white"}`}
        >
          ← Zurück zum Dashboard
        </Link>
      </div>

      {loading && <div className={isLight ? "text-slate-600" : "text-slate-400"}>Lade…</div>}
      {error && <div className={`text-sm ${isLight ? "text-red-600" : "text-red-400"}`}>{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
          Noch keine Rechnungen vorhanden.
        </div>
      )}

      {items.length > 0 && (
        <div className={`overflow-x-auto rounded-2xl border ${isLight ? "border-slate-200 bg-white shadow-sm" : "border-slate-800 bg-slate-900/60"}`}>
          <table className="min-w-full text-sm">
            <thead>
              <tr className={`border-b ${isLight ? "border-slate-200 bg-slate-100/50" : "border-slate-700 bg-slate-800/50"}`}>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  Nummer
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  Zeitraum
                </th>
                <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  Betrag
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  Status
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  Erstellt am
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? "divide-slate-100" : "divide-slate-800"}`}>
              {items.map((inv) => (
                <tr
                  key={inv.id}
                  className={`transition-colors ${isLight ? "bg-white hover:bg-slate-50" : "hover:bg-slate-800/30"}`}
                >
                  <td className={`px-4 py-3 font-mono text-xs font-medium ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                    {inv.number}
                  </td>
                  <td className={`px-4 py-3 text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                    {inv.periodStart || inv.periodEnd
                      ? `${formatDate(inv.periodStart)} – ${formatDate(
                          inv.periodEnd,
                        )}`
                      : "—"}
                  </td>
                  <td className={`px-4 py-3 text-right text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                    {formatAmount(inv)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${isLight ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                    {formatDate(inv.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/portal/invoices/${inv.id}`}
                      className={`text-xs font-medium hover:underline ${isLight ? "text-emerald-600 hover:text-emerald-700" : "text-emerald-300 hover:text-emerald-200"}`}
                    >
                      Details →
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
