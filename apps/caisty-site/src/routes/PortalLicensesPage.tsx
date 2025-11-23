import React from "react";
import {
  fetchPortalLicenses,
  type PortalLicense,
  fetchPortalMe,
} from "../lib/portalApi";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

const PortalLicensesPage: React.FC = () => {
  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "revoked" | "expired"
  >("all");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const items = await fetchPortalLicenses();
        if (cancelled) return;
        setLicenses(items);
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

    return licenses.filter((lic) => {
      if (
        statusFilter !== "all" &&
        lic.status.toLowerCase() !== statusFilter
      ) {
        return false;
      }

      if (!term) return true;

      const haystack = `${lic.key} ${lic.plan}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [licenses, statusFilter, search]);

  const showReset = statusFilter !== "all" || search.trim().length > 0;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Meine Lizenzen</h1>
        <p className="text-sm text-slate-300">
          Übersicht über alle Lizenzschlüssel, die deinem Konto zugeordnet
          sind.
        </p>
      </header>

      <LicensesSummary />

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60">
        {/* Kopf mit Status + Filter */}
        <div className="px-4 py-3 border-b border-slate-800 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-slate-300">
            {loading
              ? "Lizenzen werden geladen…"
              : filtered.length === 0
              ? "Keine Lizenzen passend zu deinem Filter."
              : `${filtered.length} Lizenz(en)`}
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
                <option value="active">active</option>
                <option value="revoked">revoked</option>
                <option value="expired">expired</option>
              </select>
            </div>

            <div className="w-40 md:w-52">
              <Input
                placeholder="Suche nach Key oder Plan…"
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
                <th className="text-left px-4 py-2 font-medium">Key</th>
                <th className="text-left px-4 py-2 font-medium">Plan</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Max Devices</th>
                <th className="text-left px-4 py-2 font-medium">Gültig bis</th>
                <th className="text-left px-4 py-2 font-medium">Erstellt am</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonLicenseRow />
                  <SkeletonLicenseRow />
                  <SkeletonLicenseRow />
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Aktuell sind hier keine Lizenzen sichtbar. Wenn du bereits
                    einen Lizenzschlüssel erhalten hast, wird er später
                    automatisch angezeigt.
                  </td>
                </tr>
              ) : (
                filtered.map((lic) => (
                  <tr
                    key={lic.id}
                    className="border-t border-slate-900/80 hover:bg-slate-900/80"
                  >
                    <td className="px-4 py-2 font-mono text-[11px] text-slate-200">
                      {lic.key}
                    </td>
                    <td className="px-4 py-2 capitalize text-slate-200">
                      {lic.plan}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={lic.status} />
                    </td>
                    <td className="px-4 py-2 text-slate-200">
                      {lic.maxDevices}
                    </td>
                    <td className="px-4 py-2 text-slate-300">
                      {formatDate(lic.validUntil)}
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {formatDate(lic.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-[11px] text-slate-500">
        Wenn du Fragen zu deinem Lizenzschlüssel hast oder ein Upgrade von
        Starter auf Pro wünschst, wende dich bitte an deinen Anbieter oder
        Caisty-Support.
      </p>
    </div>
  );
};

const LicensesSummary: React.FC = () => {
  const [name, setName] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const me = await fetchPortalMe();
      setName(me?.name ?? null);
    })();
  }, []);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-[11px] text-slate-400 flex items-center justify-between gap-3">
      <div>
        <span className="font-medium text-slate-200">
          Lizenzen für {name ?? "dein Konto"}
        </span>{" "}
        – in dieser ersten Version sind die Daten rein lesend.
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const normalized = status.toLowerCase();
  let label = status;
  let className =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] border ";

  if (normalized === "active") {
    className +=
      "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-medium";
    label = "active";
  } else if (normalized === "revoked") {
    className +=
      "border-rose-500/60 bg-rose-500/10 text-rose-300 font-medium";
    label = "revoked";
  } else if (normalized === "expired") {
    className +=
      "border-amber-500/60 bg-amber-500/10 text-amber-300 font-medium";
    label = "expired";
  } else {
    className += "border-slate-600 bg-slate-800 text-slate-300";
  }

  return <span className={className}>{label}</span>;
};

const SkeletonLicenseRow: React.FC = () => {
  return (
    <tr className="border-t border-slate-900/80">
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
        <SkeletonBar className="w-10" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBar className="w-28" />
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
  return d.toLocaleString();
}

export default PortalLicensesPage;
