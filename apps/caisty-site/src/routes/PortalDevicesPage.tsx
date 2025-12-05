import React from "react";
import { fetchPortalDevices, type PortalDevice } from "../lib/portalApi";
import { useTheme } from "../lib/theme";

const PortalDevicesPage: React.FC = () => {
  const [devices, setDevices] = React.useState<PortalDevice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { theme } = useTheme();
  const isLight = theme === "light";

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
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className={`text-2xl font-semibold tracking-tight ${isLight ? "text-slate-900" : "text-slate-50"}`}>
          Geräte
        </h1>
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
          Übersicht über alle mit deinen Lizenzen verbundenen POS-Geräte.
        </p>
      </header>

      {loading ? (
        <p className={isLight ? "text-slate-600" : "text-slate-400"}>Lade Geräte…</p>
      ) : devices.length === 0 ? (
        <div className={`rounded-2xl border p-6 text-center ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-900/60"}`}>
          <p className={isLight ? "text-slate-600" : "text-slate-400"}>Keine Geräte registriert.</p>
        </div>
      ) : (
        <div className={`overflow-x-auto rounded-2xl border ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900/60"}`}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className={`border-b text-left ${isLight ? "border-slate-200 text-slate-700" : "border-slate-700 text-slate-300"}`}>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Device ID</th>
                <th className="px-4 py-2">Lizenz</th>
                <th className="px-4 py-2">Letzter Kontakt</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d, idx) => (
                <tr key={d.id ?? idx} className={`border-b last:border-0 ${isLight ? "border-slate-100" : "border-slate-800"}`}>
                  <td className={`px-4 py-2 ${isLight ? "text-slate-900" : "text-slate-100"}`}>{d.name ?? "—"}</td>
                  <td className={`px-4 py-2 font-mono text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                    {d.deviceId ?? "—"}
                  </td>
                  <td className={`px-4 py-2 font-mono text-xs ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                    {d.licenseKey ? (
                      <div>
                        {d.licenseKey}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={`px-4 py-2 text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                    {d.lastSeenAt
                      ? new Date(d.lastSeenAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${isLight ? "bg-emerald-50 text-emerald-700" : "bg-emerald-500/10 text-emerald-300"}`}>
                      {d.status}
                    </span>
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

export default PortalDevicesPage;
