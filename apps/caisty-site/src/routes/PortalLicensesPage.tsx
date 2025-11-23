import React from "react";
import {
  fetchPortalLicenses,
  type PortalLicense,
  fetchPortalMe,
} from "../lib/portalApi";

const PortalLicensesPage: React.FC = () => {
  const [licenses, setLicenses] = React.useState<PortalLicense[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const items = await fetchPortalLicenses();
      if (cancelled) return;
      setLicenses(items);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-300">
            {loading
              ? "Lizenzen werden geladen…"
              : licenses.length === 0
              ? "Noch keine Lizenzen im Portal sichtbar."
              : `${licenses.length} Lizenz(en)`}
          </div>
        </div>

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
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Lädt…
                  </td>
                </tr>
              ) : licenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Aktuell sind hier noch keine Lizenzen sichtbar. Wenn du
                    bereits einen Lizenzschlüssel erhalten hast, wird er in
                    einer späteren Version automatisch angezeigt.
                  </td>
                </tr>
              ) : (
                licenses.map((lic) => (
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
  } else {
    className += "border-slate-600 bg-slate-800 text-slate-300";
  }

  return <span className={className}>{label}</span>;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default PortalLicensesPage;
