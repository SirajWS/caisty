import React from "react";
import { fetchPortalDevices, type PortalDevice } from "../lib/portalApi";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { portalConnectionBadge, portalPageShell, portalPageSubtitle, portalPageTitle, portalTableShell } from "../lib/portalUi";
import { formatDeviceStatus } from "../lib/caistyTerminology";

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function lastSeenCaption(
  value: string | null | undefined,
  locale: string,
  sameDayHint: string,
  prevDayHint: string,
): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const timeStr = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  if (isSameCalendarDay(d, now)) {
    return sameDayHint.replace("{{time}}", timeStr);
  }
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (isSameCalendarDay(d, y)) {
    return prevDayHint.replace("{{time}}", timeStr);
  }
  return null;
}

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

  const muted = isLight ? "text-slate-500" : "text-slate-500";
  const emptyCell = `font-mono text-xs ${muted}`;

  return (
    <div className={portalPageShell()}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{t.devices.title}</h1>
        <p className={portalPageSubtitle(isLight)}>{t.devices.subtitle}</p>
        <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-500"}`}>
          {t.layout.cloudManaged} · {t.labels.deviceBinding}
        </p>
      </header>

      {loading ? (
        <p className={isLight ? "text-slate-600" : "text-slate-400"}>{t.devices.loading}</p>
      ) : devices.length === 0 ? (
        <div
          className={`rounded-xl border px-4 py-6 text-center text-sm ${
            isLight ? "border-gray-200 bg-white text-slate-600" : "border-white/10 bg-white/[0.04] text-slate-400"
          }`}
        >
          {t.devices.empty}
        </div>
      ) : (
        <div className="space-y-4">
          <div className={portalTableShell(isLight)}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>{t.labels.name}</th>
                  <th>{t.labels.deviceId}</th>
                  <th>{t.labels.license}</th>
                  <th>{t.labels.lastHeartbeat}</th>
                  <th>{t.labels.status}</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d, idx) => {
                  const seen = d.lastSeenAt;
                  const rel =
                    seen &&
                    lastSeenCaption(seen, locale, t.devices.sameDayHint, t.devices.prevDayHint);
                  const full = formatSeen(seen);
                  return (
                    <tr key={d.id ?? idx}>
                      <td className={isLight ? "text-slate-900" : "text-slate-100"}>
                        {d.name ?? t.labels.dash}
                      </td>
                      <td className={d.deviceId ? `font-mono text-xs ${isLight ? "text-slate-700" : "text-slate-300"}` : emptyCell}>
                        {d.deviceId ?? "—"}
                      </td>
                      <td className={d.licenseKey ? "font-mono text-xs " + (isLight ? "text-slate-900" : "text-slate-100") : emptyCell}>
                        {d.licenseKey ?? t.devices.notLinked}
                      </td>
                      <td className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                        {rel ? (
                          <>
                            <span className={isLight ? "text-slate-700" : "text-slate-300"}>{rel}</span>
                            <span className={muted}> · </span>
                            <span>{full}</span>
                          </>
                        ) : (
                          full
                        )}
                      </td>
                      <td>
                        <span className={portalConnectionBadge(String(d.status ?? ""), isLight)}>{formatDeviceStatus(d.status)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className={`text-xs leading-relaxed max-w-2xl ${muted}`}>{t.devices.tableFootnote}</p>
        </div>
      )}
    </div>
  );
};

export default PortalDevicesPage;
