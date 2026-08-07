import { Link } from "react-router-dom";
import {
  Check,
  ChevronRight,
  Circle,
  Download,
  ExternalLink,
  HardDrive,
  Monitor,
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
import { portalSectionLabel } from "../../lib/portalUi";
import { useOpenDesktopPos } from "./useOpenDesktopPos";

function toneIconClass(tone: PosHubTone): string {
  if (tone === "ok") return "dashboard-icon--ok";
  if (tone === "attention") return "dashboard-icon--attention";
  if (tone === "action_required") return "dashboard-icon--action";
  return "dashboard-icon--muted";
}

function notifyRowClass(tone: PosHubNotification["tone"]): string {
  if (tone === "ok") return "dashboard-notify-row--ok";
  if (tone === "action_required") return "dashboard-notify-row--action";
  return "dashboard-notify-row--attention";
}

function toneBadgeClass(tone: PosHubTone): string {
  if (tone === "ok") return "pos-hub-badge--ok";
  if (tone === "attention") return "pos-hub-badge--attention";
  return "";
}

function deviceStatusClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "online") return "pos-hub-status-dot pos-hub-status-dot--online";
  if (s === "offline" || s === "never_seen") return "pos-hub-status-dot pos-hub-status-dot--offline";
  return "pos-hub-status-dot pos-hub-status-dot--attention";
}

function deriveReadinessScore(
  items: PosHubReadinessItem[],
  versionDone: boolean,
): number {
  const total = items.length + 1;
  const done =
    items.filter((item) => item.done).length + (versionDone ? 1 : 0);
  return total ? Math.round((done / total) * 100) : 0;
}

function ProgressRing({ score }: { score: number }) {
  const radius = 36;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2} className="dashboard-progress-ring" aria-hidden>
      <circle
        className="dashboard-progress-ring-track"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        className="dashboard-progress-ring-value"
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset: offset, transition: "stroke-dashoffset 0.4s ease" }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        transform={`rotate(-90 ${radius} ${radius})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="text-sm font-semibold">
        {score}%
      </text>
    </svg>
  );
}

export function PosHubSkeleton() {
  return (
    <div className="dashboard-kpi-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="dashboard-kpi dashboard-kpi--skeleton animate-pulse" />
      ))}
    </div>
  );
}

export function PosHubHeader({
  hub,
  envLabel,
  loading,
  p,
}: {
  hub: PosHubDerivedState;
  envLabel: string;
  loading: boolean;
  isLight?: boolean;
  p: PortalTranslations["pos"];
}) {
  const cloudTone = hub.system.cloudApiTone;

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-main min-w-0">
        <h1 className="dashboard-title">{p.title}</h1>
        <p className="dashboard-text-muted text-sm mt-1">{p.subtitle}</p>
        <div className="pos-hub-header-badges">
          <span className="pos-hub-badge pos-hub-badge--accent">
            {p.latestVersion}: {loading ? "…" : hub.version.latest}
          </span>
          <span className="pos-hub-badge">
            {p.licensePlan}: {loading ? "…" : hub.license.planLabel}
          </span>
          <span className={`pos-hub-badge ${toneBadgeClass(cloudTone)}`}>
            {p.cloudConnection}: {loading ? "…" : hub.system.cloudApiLabel}
          </span>
          <span className="pos-hub-badge">{p.systemEnvironment}: {envLabel}</span>
        </div>
      </div>
    </header>
  );
}

export function PosHubNotifications({ items }: { items: PosHubNotification[] }) {
  if (!items.length) return null;

  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id} className={`dashboard-notify-row ${notifyRowClass(n.tone)}`}>
            {n.href ? (
              n.href.startsWith("#") ? (
                <a href={n.href}>{n.message}</a>
              ) : (
                <Link to={n.href}>{n.message}</Link>
              )
            ) : (
              n.message
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PosHubKpiRow({
  hub,
  deviceCount,
  loading,
  isLight,
  p,
}: {
  hub: PosHubDerivedState;
  deviceCount: number;
  loading: boolean;
  isLight: boolean;
  p: PortalTranslations["pos"];
}) {
  if (loading) return <PosHubSkeleton />;

  const kpis = [
    { id: "installed", label: p.installedVersion, value: hub.version.installedLabel },
    { id: "latest", label: p.latestVersion, value: hub.version.latest },
    {
      id: "update",
      label: p.updateStatus,
      value: hub.version.updateStatusLabel,
      hint: hub.version.updateAvailable ? p.updateAvailable : undefined,
      hintAccent: hub.version.updateAvailable,
    },
    { id: "license", label: p.licensePlan, value: hub.license.planLabel },
    {
      id: "devices",
      label: p.kpiConnectedDevices,
      value: String(deviceCount),
      href: "/portal/devices",
    },
    {
      id: "cloud",
      label: p.cloudConnection,
      value: hub.system.cloudApiLabel,
    },
  ];

  return (
    <div className="dashboard-kpi-grid">
      {kpis.map((kpi) => {
        const body = (
          <>
            <span className={portalSectionLabel(isLight)}>{kpi.label}</span>
            <span className="dashboard-kpi-value tabular-nums">{kpi.value}</span>
            {kpi.hint ? (
              <span
                className={
                  kpi.hintAccent
                    ? "dashboard-kpi-hint dashboard-kpi-hint--update"
                    : "dashboard-kpi-hint"
                }
              >
                {kpi.hint}
              </span>
            ) : null}
          </>
        );

        if (kpi.href) {
          return (
            <Link key={kpi.id} to={kpi.href} className="dashboard-kpi dashboard-kpi--link">
              {body}
            </Link>
          );
        }

        return (
          <div key={kpi.id} className="dashboard-kpi">
            {body}
          </div>
        );
      })}
    </div>
  );
}

export function PosHubActionPanel({
  release,
  p,
}: {
  release: PosReleaseConfig;
  isLight: boolean;
  p: PortalTranslations["pos"];
}) {
  const { openDesktop, desktopFallback, desktopMobileHint } = useOpenDesktopPos(release);

  const webDesc = release.web.enabled
    ? p.openWebPosDesc
    : p.openWebPosDescFuture.replace("{{url}}", release.web.plannedUrl);

  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{p.mainActionsTitle}</h2>
      <div className="pos-hub-action-grid">
        <div className="pos-hub-action-card pos-hub-action-card--primary">
          <span className="pos-hub-action-icon">
            <Monitor size={18} />
          </span>
          <h3 className="pos-hub-action-title">{p.openDesktopPos}</h3>
          <p className="pos-hub-action-desc">{p.openDesktopPosDesc}</p>
          {desktopFallback ? (
            <p className="pos-hub-action-hint dashboard-notify-row dashboard-notify-row--attention" role="status">
              {p.desktopNotInstalled}
            </p>
          ) : null}
          {desktopMobileHint ? (
            <p className="pos-hub-action-hint dashboard-notify-row" role="status">
              {p.desktopWindowsOnly}
            </p>
          ) : null}
          <button type="button" onClick={openDesktop} className="pos-hub-action-btn pos-hub-action-btn--primary">
            {desktopFallback ? p.tryAgain : p.openDesktopPos}
          </button>
        </div>

        <div className="pos-hub-action-card">
          <span className="pos-hub-action-icon">
            <ExternalLink size={18} />
          </span>
          <h3 className="pos-hub-action-title">{p.openWebPos}</h3>
          <p className="pos-hub-action-desc">{webDesc}</p>
          {release.web.enabled && release.web.url ? (
            <a
              href={release.web.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pos-hub-action-btn no-underline"
            >
              {p.openWebPos}
            </a>
          ) : (
            <button type="button" disabled className="pos-hub-action-btn" aria-disabled>
              {p.statusComingSoon}
            </button>
          )}
        </div>

        <div className="pos-hub-action-card">
          <span className="pos-hub-action-icon">
            <Download size={18} />
          </span>
          <h3 className="pos-hub-action-title">{p.downloadLatest}</h3>
          <p className="pos-hub-action-desc">{p.downloadLatestDesc}</p>
          <a
            href={release.installer.downloadUrl}
            download={release.installer.fileName}
            className="pos-hub-action-btn no-underline"
          >
            {p.updatesDownload} ({release.latestVersion})
          </a>
        </div>
      </div>
    </section>
  );
}

export function PosHubReadinessPanel({
  hub,
  items,
  loading,
  p,
  dash,
}: {
  hub: PosHubDerivedState;
  items: PosHubReadinessItem[];
  loading: boolean;
  p: PortalTranslations["pos"];
  dash: string;
}) {
  const versionDone = !hub.version.updateAvailable && Boolean(hub.version.installed);
  const score = deriveReadinessScore(items, versionDone);

  const versionItem = {
    id: "version",
    label: p.readinessVersion,
    done: versionDone,
    tone: hub.version.updateTone,
    statusLabel: hub.version.updateStatusLabel,
  };

  const displayItems = [
    items[2],
    items[0],
    items[1],
    items[3],
    items[4],
    versionItem,
  ];

  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{p.readinessPosTitle}</h2>
      <div className="dashboard-health-layout">
        <div className="dashboard-health-score">
          <ProgressRing score={loading ? 0 : score} />
          <div>
            <p className="dashboard-health-score-label">{p.readinessPosReady}</p>
            <p className="dashboard-health-score-sub">{loading ? dash : `${score}%`}</p>
          </div>
        </div>
        <ul className="dashboard-health-list">
          {displayItems.map((item) => (
            <li key={item.id} className="dashboard-health-item">
              {item.done ? (
                <Check size={14} className="dashboard-icon--ok" />
              ) : (
                <Circle size={14} className={toneIconClass(item.tone)} />
              )}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
      {!loading && hub.license.showUpgrade ? (
        <div className="pos-hub-readiness-footer">
          <Link to={hub.license.upgradeHref} className="dashboard-quick-btn dashboard-quick-btn--primary no-underline">
            {p.licenseUpgrade}
          </Link>
          <p className="dashboard-text-muted text-xs mt-2">
            {p.licenseValidUntil}: {hub.license.validUntilLabel}
            {hub.license.maxDevices != null ? ` · ${p.licenseSeats}: ${hub.license.maxDevices}` : null}
          </p>
        </div>
      ) : null}
    </section>
  );
}

export function PosHubDevices({
  devices,
  loading,
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

  function versionLabel(device: PortalDevice): string {
    const v = device.appVersion?.trim();
    if (v) return v;
    return p.deviceVersionWaiting;
  }

  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="dashboard-panel-title m-0">{p.devicesTitle}</h2>
        {devices.length > 0 ? (
          <Link to="/portal/devices" className="dashboard-quick-btn no-underline text-xs">
            {p.devicesViewAll}
            <ChevronRight size={12} />
          </Link>
        ) : null}
      </div>

      {loading ? (
        <p className="dashboard-text-muted">{p.devicesLoading}</p>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <HardDrive size={24} className="dashboard-icon--muted" aria-hidden />
          <p className="dashboard-health-score-label">{p.devicesEmpty}</p>
          <p className="dashboard-text-muted text-xs max-w-sm">{p.devicesEmptyHint}</p>
        </div>
      ) : (
        <div className="pos-hub-device-grid">
          {devices.slice(0, 8).map((device) => (
            <article key={device.id} className="pos-hub-device-card">
              <div className="pos-hub-device-row">
                <span className="pos-hub-device-name">{device.name}</span>
                <span className={deviceStatusClass(device.status)}>{device.status}</span>
              </div>
              <div className="pos-hub-device-meta">
                <span>
                  {p.devicePlatform}: {device.platform ?? p.updatesPlatform}
                </span>
                <span>
                  {p.deviceInstalledVersion}: {versionLabel(device)}
                </span>
                <span>
                  {p.deviceLastSeen}: {formatSeen(device.lastSeenAt)}
                </span>
                {device.licenseKey ? (
                  <span>
                    {p.deviceLicenseBinding}: {device.licenseKey}
                  </span>
                ) : null}
                {device.storeName ? (
                  <span>
                    {p.deviceStore}: {device.storeName}
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function PosHubReleaseCenter({
  hub,
  release,
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
  const sizeLabel = formatInstallerBytes(
    release.installer.sizeBytes,
    locale,
    p.valueNotAvailable,
  );

  return (
    <section id="pos-release-center" className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{p.releaseCenterTitle}</h2>
      <div className="pos-hub-release-meta">
        <div>
          <div className="pos-hub-meta-label">{p.latestVersion}</div>
          <div className="pos-hub-meta-value">{release.latestVersion}</div>
        </div>
        <div>
          <div className="pos-hub-meta-label">{p.installedVersion}</div>
          <div className="pos-hub-meta-value">{hub.version.installedLabel}</div>
        </div>
        <div>
          <div className="pos-hub-meta-label">{p.releaseDate}</div>
          <div className="pos-hub-meta-value">{releaseDate}</div>
        </div>
        <div>
          <div className="pos-hub-meta-label">{p.updateStatus}</div>
          <div className="pos-hub-meta-value">{hub.version.updateStatusLabel}</div>
        </div>
      </div>
      <p className="dashboard-text-muted text-xs mt-3 leading-relaxed">{notes}</p>
      <p className="dashboard-text-muted text-xs mt-1">
        {p.installerSize}: {sizeLabel} · {release.installer.fileName}
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        {release.releaseNotesUrl ? (
          <a
            href={release.releaseNotesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dashboard-quick-btn no-underline"
          >
            {p.releaseNotesView}
          </a>
        ) : null}
        <a
          href={release.installer.downloadUrl}
          download={release.installer.fileName}
          className="dashboard-quick-btn dashboard-quick-btn--primary no-underline"
        >
          {p.updatesDownload}
        </a>
      </div>
    </section>
  );
}

export function PosHubSystemStatus({
  hub,
  envLabel,
  loading,
  p,
  dash,
}: {
  hub: PosHubDerivedState;
  envLabel: string;
  loading: boolean;
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
    <section className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{p.systemStatusTitle}</h2>
      <div className="pos-hub-system-grid">
        {rows.map((row) => (
          <div key={row.label} className="pos-hub-system-item">
            <div className="pos-hub-meta-label">{row.label}</div>
            <div className={`pos-hub-meta-value ${toneIconClass(row.tone)}`}>{row.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PosHubComingSoon({
  items,
  p,
}: {
  items: string[];
  isLight: boolean;
  p: PortalTranslations["pos"];
}) {
  return (
    <section className="dashboard-roadmap">
      <h2 className="dashboard-panel-title mb-2">{p.comingSoonTitle}</h2>
      <div className="pos-hub-coming-grid">
        {items.map((label) => (
          <div key={label} className="pos-hub-coming-item" aria-disabled>
            <span className="pos-hub-coming-label">{label}</span>
            <span className="pos-hub-coming-badge">{p.statusComingSoon}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
