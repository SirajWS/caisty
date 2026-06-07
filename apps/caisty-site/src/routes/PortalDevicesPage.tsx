import React from "react";
import { fetchPortalDevices, type PortalDevice } from "../lib/portalApi";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { portalCardShell, portalConnectionBadge, portalTableShell } from "../lib/portalUi";

const PortalDevicesPage: React.FC = () => {
  const [devices, setDevices] = React.useState<PortalDevice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const locale = portalLocaleTag(language);
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

  function formatSeen(value: string | null | undefined): string {
    if (!value) return t.labels.dash;
    return new Date(value).toLocaleString(locale);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className={`text-3xl sm:text-4xl font-semibold tracking-tight ${isLight ? "text-[#0B1220]" : "text-white"}`}>
          {t.devices.title}
        </h1>
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
          {t.devices.subtitle}
        </p>
      </header>

      {loading ? (
        <p className={isLight ? "text-slate-600" : "text-slate-400"}>{t.devices.loading}</p>
      ) : devices.length === 0 ? (
        <div className={`${portalCardShell(isLight)} text-center`}>
          <p className={isLight ? "text-slate-600" : "text-slate-400"}>{t.devices.empty}</p>
        </div>
      ) : (
        <div className={portalTableShell(isLight)}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className={`border-b ${isLight ? "border-slate-200 bg-slate-50" : "border-white/[0.08] bg-[#0f172a]"}`}>
                <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide ${isLight ? "text-slate-600" : "text-slate-400"}`}>{t.labels.name}</th>
                <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide ${isLight ? "text-slate-600" : "text-slate-400"}`}>{t.labels.deviceId}</th>
                <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide ${isLight ? "text-slate-600" : "text-slate-400"}`}>{t.labels.license}</th>
                <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide ${isLight ? "text-slate-600" : "text-slate-400"}`}>{t.labels.lastSeen}</th>
                <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide ${isLight ? "text-slate-600" : "text-slate-400"}`}>{t.labels.status}</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d, idx) => (
                <tr
                  key={d.id ?? idx}
                  className={`border-b last:border-0 ${isLight ? "border-slate-100 bg-white hover:bg-slate-50" : "border-white/[0.06] bg-[#111827] hover:bg-[#0f172a]"}`}
                >
                  <td className={`px-4 py-3 ${isLight ? "text-slate-900" : "text-slate-100"}`}>{d.name ?? t.labels.dash}</td>
                  <td className={`px-4 py-3 font-mono text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                    {d.deviceId ?? t.labels.dash}
                  </td>
                  <td className={`px-4 py-3 font-mono text-xs ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                    {d.licenseKey ? <div>{d.licenseKey}</div> : t.labels.dash}
                  </td>
                  <td className={`px-4 py-3 text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                    {formatSeen(d.lastSeenAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={portalConnectionBadge(String(d.status ?? ""), isLight)}>{d.status}</span>
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
