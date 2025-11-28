import React from "react";
import { fetchPortalDevices } from "../lib/portalApi";
import { usePortalCustomer } from "./PortalLayout";

type Device = {
  fingerprint: string | null;
  name: string | null;
  status: string;
  lastSeenAt: string | null;
  licenseKeys: { key: string; plan: string }[];
};

const PortalDevicesPage: React.FC = () => {
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [loading, setLoading] = React.useState(true);
  const customer = usePortalCustomer();

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchPortalDevices();
        if (!cancelled) setDevices(items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Geräte von {customer?.name ?? "Kunde"}
      </h1>
      {loading ? (
        <p>Lade Geräte…</p>
      ) : devices.length === 0 ? (
        <p className="text-slate-400">Keine Geräte registriert.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-900/40 text-left">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Fingerprint</th>
              <th className="px-3 py-2">Lizenzen</th>
              <th className="px-3 py-2">Letzter Kontakt</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.fingerprint ?? Math.random()} className="border-t border-slate-800">
                <td className="px-3 py-2">{d.name ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-400">
                  {d.fingerprint ?? "—"}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {d.licenseKeys.map((l) => (
                    <div key={l.key}>
                      {l.key} <span className="text-slate-400">({l.plan})</span>
                    </div>
                  ))}
                </td>
                <td className="px-3 py-2 text-xs text-slate-400">
                  {d.lastSeenAt
                    ? new Date(d.lastSeenAt).toLocaleString()
                    : "—"}
                </td>
                <td className="px-3 py-2">{d.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PortalDevicesPage;
