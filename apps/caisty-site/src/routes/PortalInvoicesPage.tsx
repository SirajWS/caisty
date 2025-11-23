import React from "react";
import {
  fetchPortalInvoices,
  type PortalInvoice,
  fetchPortalMe,
} from "../lib/portalApi";

const PortalInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = React.useState<PortalInvoice[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const items = await fetchPortalInvoices();
      if (cancelled) return;
      setInvoices(items);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Rechnungen</h1>
        <p className="text-sm text-slate-300">
          Übersicht über deine Abrechnungen und Zahlungsstatus.
        </p>
      </header>

      <InvoicesSummary />

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-300">
          {loading
            ? "Rechnungen werden geladen…"
            : invoices.length === 0
            ? "Noch keine Rechnungen für dieses Konto."
            : `${invoices.length} Rechnung(en)`}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase text-slate-500">
                <th className="text-left px-4 py-2 font-medium">Nummer</th>
                <th className="text-left px-4 py-2 font-medium">Zeitraum</th>
                <th className="text-left px-4 py-2 font-medium">Betrag</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Erstellt am</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Lädt…
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Sobald dein Anbieter dir eine Rechnung stellt, wird sie
                    hier automatisch angezeigt.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-t border-slate-900/80 hover:bg-slate-900/80"
                  >
                    <td className="px-4 py-2 font-mono text-[11px] text-slate-200">
                      {inv.number}
                    </td>
                    <td className="px-4 py-2 text-slate-300">
                      {formatDate(inv.periodFrom)} –{" "}
                      {formatDate(inv.periodTo)}
                    </td>
                    <td className="px-4 py-2 text-slate-200">
                      {formatAmount(inv.amount, inv.currency)}
                    </td>
                    <td className="px-4 py-2">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {formatDate(inv.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-[11px] text-slate-500">
        In einer späteren Version werden hier auch PDF-Downloads und
        Zahlungsdetails angezeigt.
      </p>
    </div>
  );
};

const InvoicesSummary: React.FC = () => {
  const [name, setName] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const me = await fetchPortalMe();
      setName(me?.name ?? null);
    })();
  }, []);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-[11px] text-slate-400">
      Rechnungen für{" "}
      <span className="font-medium text-slate-200">{name ?? "dein Konto"}</span>
      . Aktuell nur lesend – Zahlungsabwicklung erfolgt weiterhin über deinen
      Anbieter.
    </div>
  );
};

const InvoiceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const normalized = status.toLowerCase();
  let className =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] border ";

  if (normalized === "paid") {
    className +=
      "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-medium";
  } else if (normalized === "open") {
    className +=
      "border-amber-500/60 bg-amber-500/10 text-amber-300 font-medium";
  } else if (normalized === "failed") {
    className += "border-rose-500/60 bg-rose-500/10 text-rose-300 font-medium";
  } else {
    className += "border-slate-600 bg-slate-800 text-slate-300";
  }

  return <span className={className}>{status}</span>;
};

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function formatAmount(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export default PortalInvoicesPage;

