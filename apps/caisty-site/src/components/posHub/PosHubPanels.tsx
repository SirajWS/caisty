import React from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  HardDrive,
  Monitor,
  Sparkles,
  X,
} from "lucide-react";
import type { PortalTranslations } from "../../lib/translations/portal";
import type { PortalDevice } from "../../lib/portalApi";
import type { PosReleaseConfig } from "../../config/posConfig";
import type {
  PosHubDerivedState,
  PosHubNotification,
  PosHubReadinessItem,
  PosHubTone,
} from "../../lib/posHub/types";
import { formatInstallerBytes } from "../../lib/posHub/format";
import {
  portalCardShell,
  portalCloudStatusTone,
  portalCompactCard,
  portalConnectionBadge,
  portalLicenseStatusBadge,
  portalPrimaryCta,
  portalSecondaryCta,
  portalSectionLabel,
  portalTextLink,
} from "../../lib/portalUi";

const DESKTOP_OPEN_TIMEOUT_MS = 1800;

function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function toneBorder(tone: PosHubTone, isLight: boolean): string {
  if (tone === "ok") {
    return isLight ? "border-emerald-200 bg-emerald-50" : "border-emerald-500/30 bg-emerald-500/10";
  }
  if (tone === "attention") {
    return isLight ? "border-amber-200 bg-amber-50" : "border-amber-500/30 bg-amber-500/10";
  }
  if (tone === "action_required") {
    return isLight ? "border-rose-200 bg-rose-50" : "border-rose-500/30 bg-rose-500/10";
  }
  return isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/[0.04]";
}

export function PosHubSkeleton({ isLight }: { isLight: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={`h-16 rounded-xl animate-pulse ${isLight ? "bg-slate-200" : "bg-slate-800"}`}
        />
      ))}
    </div>
  );
}

export function PosHubNotifications({
  items,
  isLight,
}: {
  items: PosHubNotification[];
  isLight: boolean;
}) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      {items.map((n) => (
        <div
          key={n.id}
          className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs ${toneBorder(n.tone, isLight)}`}
        >
          <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden />
          <div className="flex-1 min-w-0">
            <p className={isLight ? "text-slate-800" : "text-slate-200"}>{n.message}</p>
            {n.href && n.href.startsWith("/") ? (
              <Link to={n.href} className={`text-[11px] no-underline ${portalTextLink(isLight)}`}>
                →
              </Link>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PosHubVersionHero({
  hub,
  loading,
  isLight,
  p,
}: {
  hub: PosHubDerivedState;
  loading: boolean;
  isLight: boolean;
  p: PortalTranslations["pos"];
}) {
  const tiles = [
    { label: p.installedVersion, value: hub.version.installedLabel, tone: hub.version.updateTone },
    { label: p.latestVersion, value: hub.version.latest, tone: "ok" as PosHubTone },
    { label: p.updateStatus, value: hub.version.updateStatusLabel, tone: hub.version.updateTone },
    { label: p.licensePlan, value: hub.license.planLabel, tone: hub.license.statusTone },
  ];

  return (
    <section className={`${portalCardShell(isLight)} grid gap-3 grid-cols-2 lg:grid-cols-4`}>
      {tiles.map((tile) => (
        <div key={tile.label} className="min-w-0">
          <div className={portalSectionLabel(isLight)}>{tile.label}</div>
          {loading ? (
            <span className={`mt-1 inline-block h-4 w-20 rounded animate-pulse ${isLight ? "bg-slate-200" : "bg-slate-700"}`} />
          ) : (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`text-sm font-semibold truncate ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                {tile.value}
              </span>
              <span className={portalCloudStatusTone(tile.tone, isLight)}>{tile.label === p.updateStatus ? "" : ""}</span>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

export function PosHubLicenseCard({
  hub,
  loading,
  isLight,
  p,
}: {
  hub: PosHubDerivedState;
  loading: boolean;
  isLight: boolean;
  p: PortalTranslations["pos"];
}) {
  const lic = hub.license;
  return (
    <section className={`${portalCardShell(isLight)} space-y-3`}>
      <h2 className={portalSectionLabel(isLight)}>{p.licenseStatus}</h2>
      {loading ? (
        <PosHubSkeleton isLight={isLight} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div>
              <div className={portalSectionLabel(isLight)}>{p.licensePlan}</div>
              <p className={`mt-1 font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>{lic.planLabel}</p>
            </div>
            <div>
              <div className={portalSectionLabel(isLight)}>{p.licenseStatus}</div>
              <p className="mt-1">
                <span className={portalLicenseStatusBadge(lic.statusLabel, isLight)}>{lic.statusLabel}</span>
              </p>
            </div>
            <div>
              <div className={portalSectionLabel(isLight)}>{p.licenseValidUntil}</div>
              <p className={`mt-1 font-medium ${isLight ? "text-slate-800" : "text-slate-200"}`}>{lic.validUntilLabel}</p>
            </div>
            <div>
              <div className={portalSectionLabel(isLight)}>{p.licenseSeats}</div>
              <p className={`mt-1 font-medium ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                {lic.maxDevices ?? p.valueNotAvailable}
              </p>
            </div>
          </div>
          {lic.showUpgrade ? (
            <Link to={lic.upgradeHref} className={`no-underline inline-flex ${portalPrimaryCta()}`}>
              {p.licenseUpgrade}
            </Link>
          ) : null}
        </>
      )}
    </section>
  );
}

export function PosHubQuickActions({
  release,
  isLight,
  p,
}: {
  release: PosReleaseConfig;
  isLight: boolean;
  p: PortalTranslations["pos"];
}) {
  const [desktopFallback, setDesktopFallback] = React.useState(false);
  const [desktopMobileHint, setDesktopMobileHint] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  function openDesktop() {
    setDesktopFallback(false);
    setDesktopMobileHint(false);
    if (isMobileUserAgent()) {
      setDesktopMobileHint(true);
      return;
    }
    const onBlur = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      window.removeEventListener("blur", onBlur);
      setDesktopFallback(false);
    };
    window.addEventListener("blur", onBlur);
    timerRef.current = window.setTimeout(() => {
      window.removeEventListener("blur", onBlur);
      timerRef.current = null;
      setDesktopFallback(true);
    }, DESKTOP_OPEN_TIMEOUT_MS);
    window.location.href = release.desktop.openUrl;
  }

  const webDesc = release.web.enabled
    ? p.openWebPosDesc
    : p.openWebPosDescFuture.replace("{{url}}", release.web.plannedUrl);

  return (
    <section className="space-y-3">
      <h2 className={portalSectionLabel(isLight)}>{p.quickActions}</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <ActionCard icon={<ExternalLink size={18} />} title={p.openWebPos} desc={webDesc} isLight={isLight}>
          {release.web.enabled && release.web.url ? (
            <a href={release.web.url} target="_blank" rel="noopener noreferrer" className={`no-underline w-full text-center ${portalPrimaryCta()}`}>
              {p.openWebPos}
            </a>
          ) : (
            <button type="button" disabled className={`w-full ${portalSecondaryCta(isLight)} opacity-70 cursor-not-allowed`}>
              {p.statusComingSoon}
            </button>
          )}
        </ActionCard>

        <ActionCard icon={<Monitor size={18} />} title={p.openDesktopPos} desc={p.openDesktopPosDesc} isLight={isLight}>
          {desktopFallback ? (
            <p className={`rounded-lg border px-3 py-2 text-xs ${toneBorder("attention", isLight)}`} role="status">{p.desktopNotInstalled}</p>
          ) : null}
          {desktopMobileHint ? (
            <p className={`rounded-lg border px-3 py-2 text-xs ${toneBorder("unknown", isLight)}`} role="status">{p.desktopWindowsOnly}</p>
          ) : null}
          <button type="button" onClick={openDesktop} className={`w-full ${portalSecondaryCta(isLight)}`}>
            {desktopFallback ? p.tryAgain : p.openDesktopPos}
          </button>
        </ActionCard>

        <PosHubDownloadCard release={release} isLight={isLight} p={p} compact />
      </div>
    </section>
  );
}

function ActionCard({
  icon,
  title,
  desc,
  isLight,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  isLight: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`${portalCardShell(isLight)} flex flex-col gap-3`}>
      <div className="flex items-center gap-2">
        <span className={isLight ? "text-orange-600" : "text-orange-400"}>{icon}</span>
        <span className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>{title}</span>
      </div>
      <p className={`text-xs flex-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>{desc}</p>
      {children}
    </div>
  );
}

export function PosHubDownloadCard({
  release,
  isLight,
  p,
  locale,
  compact = false,
}: {
  release: PosReleaseConfig;
  isLight: boolean;
  p: PortalTranslations["pos"];
  locale?: string;
  compact?: boolean;
}) {
  const { installer } = release;
  const sizeLabel = formatInstallerBytes(
    installer.sizeBytes,
    locale ?? "en",
    p.valueNotAvailable,
  );
  const releaseDate = release.releaseDate
    ? new Date(release.releaseDate).toLocaleDateString(locale)
    : p.valueNotAvailable;

  const button = (
    <a
      href={installer.downloadUrl}
      download={installer.fileName}
      className={`no-underline ${compact ? "w-full text-center" : "shrink-0"} ${portalPrimaryCta()}`}
    >
      {compact ? `${p.downloadLatest} (${release.latestVersion})` : p.updatesDownload}
    </a>
  );

  if (compact) {
    return (
      <ActionCard icon={<Download size={18} />} title={p.downloadLatest} desc={p.downloadLatestDesc} isLight={isLight}>
        {button}
      </ActionCard>
    );
  }

  return (
    <section className={`${portalCardShell(isLight)} space-y-3`}>
      <h2 className={portalSectionLabel(isLight)}>{p.downloadCardTitle}</h2>
      <dl className="grid gap-2 sm:grid-cols-2 text-xs">
        <MetaRow label={p.updatesPlatform} value={installer.platform} isLight={isLight} />
        <MetaRow label={p.latestVersion} value={release.latestVersion} isLight={isLight} />
        <MetaRow label={p.releaseDate} value={releaseDate} isLight={isLight} />
        <MetaRow label={p.installerSize} value={sizeLabel} isLight={isLight} />
        <MetaRow label={p.installerFileName} value={installer.fileName} isLight={isLight} mono />
        <MetaRow label={p.installerSha256} value={installer.sha256 ?? p.valueNotAvailable} isLight={isLight} mono />
      </dl>
      {button}
    </section>
  );
}

function MetaRow({
  label,
  value,
  isLight,
  mono,
}: {
  label: string;
  value: string;
  isLight: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className={portalSectionLabel(isLight)}>{label}</dt>
      <dd className={`mt-0.5 font-medium truncate ${mono ? "font-mono text-[11px]" : ""} ${isLight ? "text-slate-800" : "text-slate-200"}`}>
        {value}
      </dd>
    </div>
  );
}

export function PosHubReadiness({
  items,
  loading,
  isLight,
  p,
  dash,
}: {
  items: PosHubReadinessItem[];
  loading: boolean;
  isLight: boolean;
  p: PortalTranslations["pos"];
  dash: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className={portalSectionLabel(isLight)}>{p.readinessTitle}</h2>
      <div className={`${portalCardShell(isLight)} divide-y ${isLight ? "divide-slate-100" : "divide-white/10"}`}>
        {items.map((row) => (
          <Link
            key={row.id}
            to={row.href}
            className={`flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 no-underline group ${isLight ? "hover:bg-slate-50/80" : "hover:bg-white/[0.03]"}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  row.done ? "bg-emerald-500 text-white" : isLight ? "bg-slate-200 text-slate-500" : "bg-slate-700 text-slate-400"
                }`}
              >
                {row.done ? <Check size={14} /> : <X size={14} />}
              </span>
              <span className={`text-sm font-medium ${isLight ? "text-slate-900" : "text-slate-100"}`}>{row.label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={portalCloudStatusTone(row.tone, isLight)}>
                {loading ? dash : row.statusLabel}
              </span>
              <ChevronRight size={14} className={`opacity-50 group-hover:opacity-100 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PosHubDevices({
  devices,
  loading,
  isLight,
  p,
  locale,
  dash,
}: {
  devices: PortalDevice[];
  loading: boolean;
  isLight: boolean;
  p: PortalTranslations["pos"];
  locale: string;
  dash: string;
}) {
  function formatSeen(value: string | null | undefined): string {
    if (!value) return dash;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString(locale);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={portalSectionLabel(isLight)}>{p.devicesTitle}</h2>
        {devices.length > 0 ? (
          <Link to="/portal/devices" className={`text-xs no-underline ${portalTextLink(isLight)}`}>
            {p.devicesViewAll} →
          </Link>
        ) : null}
      </div>
      <div className={portalCardShell(isLight)}>
        {loading ? (
          <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>{p.devicesLoading}</p>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center px-4">
            <HardDrive size={28} className={isLight ? "text-slate-300" : "text-slate-600"} aria-hidden />
            <p className={`text-sm font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>{p.devicesEmpty}</p>
            <p className={`text-xs max-w-sm ${isLight ? "text-slate-500" : "text-slate-500"}`}>{p.devicesEmptyHint}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {devices.slice(0, 8).map((device) => (
              <li
                key={device.id}
                className={`rounded-lg border px-3 py-2.5 ${isLight ? "border-slate-100 bg-slate-50/80" : "border-white/10 bg-white/[0.03]"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className={`text-sm font-medium truncate ${isLight ? "text-slate-900" : "text-slate-100"}`}>{device.name}</div>
                    <div className="mt-1 grid gap-0.5 text-[11px]">
                      <span className={isLight ? "text-slate-500" : "text-slate-500"}>
                        {p.devicePlatform}: {device.platform ?? p.updatesPlatform}
                      </span>
                      <span className={isLight ? "text-slate-500" : "text-slate-500"}>
                        {p.deviceInstalledVersion}: {device.appVersion?.trim() || p.versionUnknown}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <span className={portalConnectionBadge(device.status, isLight)}>{device.status}</span>
                    <span className={`text-[10px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                      {p.deviceLastSeen}: {formatSeen(device.lastSeenAt)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function PosHubSystemStatus({
  hub,
  envLabel,
  loading,
  isLight,
  p,
  dash,
}: {
  hub: PosHubDerivedState;
  envLabel: string;
  loading: boolean;
  isLight: boolean;
  p: PortalTranslations["pos"];
  dash: string;
}) {
  const rows = [
    { label: p.systemCloudApi, value: hub.system.cloudApiLabel, tone: hub.system.cloudApiTone },
    { label: p.systemPortal, value: hub.system.portalLabel, tone: hub.system.portalTone },
    { label: p.systemEnvironment, value: envLabel, tone: "unknown" as PosHubTone },
    { label: p.systemLastSync, value: loading ? dash : hub.system.lastSyncLabel, tone: "unknown" as PosHubTone },
  ];

  return (
    <section className="space-y-3">
      <h2 className={portalSectionLabel(isLight)}>{p.systemStatusTitle}</h2>
      <div className={`${portalCardShell(isLight)} grid gap-3 sm:grid-cols-2 lg:grid-cols-4`}>
        {rows.map((row) => (
          <div key={row.label}>
            <div className={portalSectionLabel(isLight)}>{row.label}</div>
            <div className="mt-1">
              <span className={portalCloudStatusTone(row.tone, isLight)}>{row.value}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PosHubReleaseCenter({
  hub,
  release,
  isLight,
  p,
  locale,
}: {
  hub: PosHubDerivedState;
  release: PosReleaseConfig;
  isLight: boolean;
  p: PortalTranslations["pos"];
  locale: string;
}) {
  const releaseDate = release.releaseDate
    ? new Date(release.releaseDate).toLocaleDateString(locale)
    : p.valueNotAvailable;
  const notes =
    release.releaseNotesSummary ||
    (release.releaseNotesUrl ? p.releaseNotesView : p.releaseNotesUnavailable);

  return (
    <section id="pos-release-center" className="space-y-3">
      <h2 className={portalSectionLabel(isLight)}>{p.releaseCenterTitle}</h2>
      <div className={`${portalCardShell(isLight)} space-y-4`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <MetaRow label={p.latestVersion} value={release.latestVersion} isLight={isLight} />
          <MetaRow label={p.installedVersion} value={hub.version.installedLabel} isLight={isLight} />
          <MetaRow label={p.releaseDate} value={releaseDate} isLight={isLight} />
          <MetaRow label={p.updateStatus} value={hub.version.updateStatusLabel} isLight={isLight} />
        </div>
        <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>{notes}</p>
        <div className="flex flex-wrap gap-2">
          {release.releaseNotesUrl ? (
            <a
              href={release.releaseNotesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`no-underline ${portalSecondaryCta(isLight)}`}
            >
              {p.releaseNotesView}
            </a>
          ) : null}
          <a
            href={release.installer.downloadUrl}
            download={release.installer.fileName}
            className={`no-underline ${portalPrimaryCta()}`}
          >
            {p.updatesDownload}
          </a>
        </div>
      </div>
    </section>
  );
}

export function PosHubComingSoon({
  items,
  isLight,
  p,
}: {
  items: string[];
  isLight: boolean;
  p: PortalTranslations["pos"];
}) {
  return (
    <section className="space-y-3">
      <h2 className={portalSectionLabel(isLight)}>{p.comingSoonTitle}</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((label) => (
          <div key={label} className={`${portalCompactCard(isLight)} flex items-center justify-between gap-2 opacity-75`}>
            <span className={`text-xs font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>{label}</span>
            <span className="inline-flex items-center gap-1">
              <Sparkles size={12} className="text-orange-500" aria-hidden />
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                {p.statusComingSoon}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
