// apps/caisty-site/src/portal/PortalInvoicesPage.tsx

import React from "react";
import { Link } from "react-router-dom";
import { fetchPortalInvoices, type PortalInvoice } from "../../lib/portalApi";

const formatMoney = (cents: number, currency: string) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(cents / 100);

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("de-DE") : "—";

const PortalInvoicesPage: React.FC = () => {
  const [items, setItems] = React.useState<PortalInvoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPortalInvoices();
        if (!cancelled) setItems(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Fehler beim Laden");
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
      <h1 className="text-2xl font-semibold">Rechnungen</h1>
      <p className="text-sm text-slate-300">
        Übersicht über deine Abrechnungen und Zahlungsstatus.
      </p>

      {loading && <div>Lade…</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}

      {!loading && items.length === 0 && (
        <div className="text-sm text-slate-400">
          Noch keine Rechnungen vorhanden.
        </div>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-slate-900/60 border border-slate-700">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-300">
                <th className="px-4 py-2 text-left">Nummer</th>
                <th className="px-4 py-2 text-left">Zeitraum</th>
                <th className="px-4 py-2 text-right">Betrag</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Erstellt am</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-slate-800 last:border-0"
                >
                  <td className="px-4 py-2">
                    <Link
                      to={`/portal/invoices/${inv.id}`}
                      className="text-emerald-300 hover:underline"
                    >
                      {inv.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-300">
                    {inv.periodStart || inv.periodEnd
                      ? `${formatDate(inv.periodStart)} – ${formatDate(
                          inv.periodEnd,
                        )}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-100">
                    {formatMoney(inv.amountCents, inv.currency)}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-emerald-900/60 text-emerald-300">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-300">
                    {formatDate(inv.createdAt)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      to={`/portal/invoices/${inv.id}`}
                      className="text-xs text-emerald-300 hover:underline"
                    >
                      Details
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
