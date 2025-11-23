import React from "react";
import {
  fetchPortalInvoices,
  type PortalInvoice,
  fetchPortalMe,
} from "../lib/portalApi";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

const PortalInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = React.useState<PortalInvoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "open" | "paid" | "failed"
  >("all");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const items = await fetchPortalInvoices();
        if (cancelled) return;
        setInvoices(items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();

    return invoices.filter((inv) => {
      if (
        statusFilter !== "all" &&
        inv.status.toLowerCase() !== statusFilter
      ) {
        return false;
      }

      if (!term) return true;

      const haystack = `${inv.number} ${inv.currency}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [invoices, statusFilter, search]);

  const showReset = statusFilter !== "all" || search.trim().length > 0;

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
        {/* Kopf mit Status + Filter */}
        <div className="px-4 py-3 border-b border-slate-800 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-slate-300">
            {loading
              ? "Rechnungen werden geladen…"
              : filtered.length === 0
              ? "Keine Rechnungen passend zu deinem Filter."
              : `${filtered.length} Rechnung(en)`}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Status:</span>
              <select
                className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 focus:border-emerald-500 focus:outline-none"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as typeof statusFilter)
                }
              >
                <option value="all">Alle</option>
                <option value="open">open</option>
                <option value="paid">paid</option>
                <option value="failed">failed</option>
              </select>
            </div>

            <div className="w-40 md:w-52">
              <Input
                placeholder="Suche nach Rechnungs-Nr.…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 px-2 py-1 text-[11px]"
              />
            </div>

            {showReset && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setStatusFilter("all");
                  setSearch("");
                }}
              >
                Filter zurücksetzen
              </Button>
            )}
          </div>
        </div>

        {/* Tabelle */}
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
                <>
                  <SkeletonInvoiceRow />
                  <SkeletonInvoiceRow />
                  <SkeletonInvoiceRow />
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Sobald dein Anbieter dir eine Rechnung stellt, wird sie hier
                    automatisch angezeigt.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
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

const SkeletonInvoiceRow: React.FC = () => {
  return (
    <tr className="border-t border-slate-900/80">
      <td className="px-4 py-3">
        <SkeletonBar className="w-32" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBar className="w-40" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBar className="w-20" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBar className="w-16" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBar className="w-24" />
      </td>
    </tr>
  );
};

const SkeletonBar: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={[
      "h-3 rounded-full bg-slate-800 animate-pulse",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  />
);

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
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
