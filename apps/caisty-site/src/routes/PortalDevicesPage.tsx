import React from "react";
import {
  fetchPortalDevices,
  type PortalDevice,
} from "../lib/portalApi";
import { usePortalCustomer } from "./PortalLayout";

const PortalDevicesPage: React.FC = () => {
  const [devices, setDevices] = React.useState<PortalDevice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "online" | "offline" | "never_seen"
  >("all");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const items = await fetchPortalDevices();
        if (cancelled) return;
        setDevices(items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDevices = React.useMemo(() => {
    let list = devices;

    if (statusFilter !== "all") {
      const target = statusFilter.toLowerCase();
      list = list.filter(
        (d) => d.status?.toLowerCase() === target,
      );
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((d) => {
        const name = d.name?.toLowerCase() ?? "";
        const id = d.deviceId?.toLowerCase() ?? "";
        const key = d.licenseKey?.toLowerCase() ?? "";
        return (
          name.includes(q) || id.includes(q) || key.includes(q)
        );
      });
    }

    return list;
  }, [devices, statusFilter, search]);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Verbundene Geräte
        </h1>
        <p className="text-sm text-slate-300">
          Alle POS-Geräte, die aktuell mit deinem Caisty Konto verbunden
          sind.
        </p>
      </header>

      <DevicesSummary total={devices.length} />

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="px-4 py-3 border-b border-slate-800 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-slate-300">
            {loading
              ? "Geräte werden geladen…"
              : devices.length === 0
              ? "Noch keine Geräte im Portal sichtbar."
              : `${devices.length} Gerät(e) insgesamt`}
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 text-xs">
            <div className="inline-flex items-center gap-2">
              <span className="text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as any)
                }
                className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-100 outline-none"
              >
                <option value="all">Alle</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="never_seen">Noch nie gesehen</option>
              </select>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Suche nach Name, ID oder Lizenz…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-64 rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase text-slate-500">
                <th className="text-left px-4 py-2 font-medium">Name</th>
                <th className="text-left px-4 py-2 font-medium">
                  Device-ID
                </th>
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
                <SkeletonDeviceRows />
              ) : devices.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Sobald ein POS-Gerät mit deinem Lizenzschlüssel
                    startet, taucht es hier automatisch auf.
                  </td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Keine Geräte passend zu deinem Filter.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((d) => (
                  <tr
                    key={d.id}
                    className="border-t border-slate-900/80 hover:bg-slate-900/80"
                  >
                    <td className="px-4 py-2 text-slate-200">
                      {d.name || "—"}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-slate-300">
                      {d.deviceId || "—"}
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
        Für jedes POS-Gerät kannst du später Limits, Health-Monitoring
        (CPU, Speicher, Ping) und Zugriffsrechte konfigurieren. In dieser
        Version sind die Daten rein lesend.
      </p>
    </div>
  );
};

const DevicesSummary: React.FC<{ total: number }> = ({ total }) => {
  const customer = usePortalCustomer();

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        Alle Geräte, die mit Lizenzen deines Kontos{" "}
        <span className="font-medium text-slate-200">
          {customer.name}
        </span>{" "}
        verbunden sind.
      </div>
      <div className="flex items-center gap-3 text-[11px] text-slate-300">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          Online:{" "}
          {
            // nur Anzeige, Filterlogik bleibt in der Tabelle
            customer && total
          }
        </span>
        <span className="hidden sm:inline text-slate-600">
          • Übersicht in Echtzeit, sobald Geräte Heartbeats senden
        </span>
      </div>
    </div>
  );
};

const SkeletonDeviceRows: React.FC = () => {
  return (
    <>
      {Array.from({ length: 3 }).map((_, idx) => (
        <tr key={idx} className="border-t border-slate-900/80">
          <td className="px-4 py-3">
            <div className="h-3 w-32 rounded bg-slate-800 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-3 w-40 rounded bg-slate-800 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-3 w-20 rounded-full bg-slate-800 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-3 w-32 rounded bg-slate-800 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-3 w-32 rounded bg-slate-800 animate-pulse" />
          </td>
        </tr>
      ))}
    </>
  );
};

const DeviceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const normalized = status?.toLowerCase();
  let className =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] border ";

  if (normalized === "online") {
    className +=
      "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-medium";
  } else if (normalized === "offline") {
    className +=
      "border-slate-600 bg-slate-800 text-slate-300 font-medium";
  } else if (normalized === "never_seen") {
    className +=
      "border-slate-600 bg-slate-900 text-slate-400 font-normal";
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
