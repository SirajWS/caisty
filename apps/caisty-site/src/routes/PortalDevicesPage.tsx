import React from "react";
import {
  fetchPortalDevices,
  type PortalDevice,
  fetchPortalMe,
} from "../lib/portalApi";

const PortalDevicesPage: React.FC = () => {
  const [devices, setDevices] = React.useState<PortalDevice[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const items = await fetchPortalDevices();
      if (cancelled) return;
      setDevices(items);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Verbundene Geräte
        </h1>
        <p className="text-sm text-slate-300">
          Alle POS-Geräte, die aktuell mit deinem Caisty Konto verbunden sind.
        </p>
      </header>

      <DevicesSummary />

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-300">
          {loading
            ? "Geräte werden geladen…"
            : devices.length === 0
            ? "Noch keine Geräte mit einer Lizenz verbunden."
            : `${devices.length} Gerät(e)`}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase text-slate-500">
                <th className="text-left px-4 py-2 font-medium">Name</th>
                <th className="text-left px-4 py-2 font-medium">Device-ID</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">
                  Letztes Signal
                </th>
                <th className="text-left px-4 py-2 font-medium">
                  Lizenz-Key
                </th>
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
              ) : devices.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Sobald ein POS-Gerät mit deinem Lizenzschlüssel startet,
                    taucht es hier automatisch auf.
                  </td>
                </tr>
              ) : (
                devices.map((d) => (
                  <tr
                    key={d.id}
                    className="border-t border-slate-900/80 hover:bg-slate-900/80"
                  >
                    <td className="px-4 py-2 text-slate-200">{d.name}</td>
                    <td className="px-4 py-2 font-mono text-[11px] text-slate-300">
                      {d.deviceId}
                    </td>
                    <td className="px-4 py-2">
                      <DeviceStatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-2 text-slate-300">
                      {d.lastSeenAt ? formatDate(d.lastSeenAt) : "—"}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-slate-300">
                      {d.licenseKey ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-[11px] text-slate-500">
        Für jedes POS-Gerät kannst du später Limits und Zugriffsrechte
        konfigurieren. In dieser Version sind die Daten rein lesend.
      </p>
    </div>
  );
};

const DevicesSummary: React.FC = () => {
  const [name, setName] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const me = await fetchPortalMe();
      setName(me?.name ?? null);
    })();
  }, []);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-[11px] text-slate-400">
      Alle Geräte, die mit Lizenzen deines Kontos{" "}
      <span className="font-medium text-slate-200">{name ?? ""}</span>{" "}
      verbunden sind.
    </div>
  );
};

const DeviceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const normalized = status.toLowerCase();
  let className =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] border ";

  if (normalized === "online") {
    className +=
      "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-medium";
  } else if (normalized === "offline") {
    className +=
      "border-slate-600 bg-slate-800 text-slate-300 font-medium";
  } else {
    className += "border-slate-600 bg-slate-800 text-slate-300";
  }

  return <span className={className}>{status}</span>;
};

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default PortalDevicesPage;
