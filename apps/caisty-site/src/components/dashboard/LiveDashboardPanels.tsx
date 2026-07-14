import { Link } from "react-router-dom";
import {
  Activity,
  Bell,
  ChevronRight,
  Circle,
  Cloud,
  Download,
  ExternalLink,
  FileText,
  HardDrive,
  Lock,
  Monitor,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  Shield,
  User,
} from "lucide-react";
import type { PortalTranslations } from "../../lib/translations/portal";
import type { PosHubTone } from "../../lib/posHub/types";
import type {
  BusinessAlert,
  DashboardActivity,
  DashboardKpi,
  DashboardQuickAction,
  LiveDeviceCard,
  LiveReleaseCenter,
  LiveStoreStatusItem,
  RemoteAction,
  StoreSnapshot,
  SystemHealthItem,
} from "../../lib/dashboard/types";
import type { PosReleaseConfig } from "../../config/posConfig";
import { OrderStatusBadge } from "../orders/OrderStatusBadge";
import type { PortalDashboardRecentOrder } from "../../lib/dashboard/types";
import { openDesktopPos } from "../devices/openDesktopPos";
import { portalSectionLabel } from "../../lib/portalUi";

type LiveCopy = PortalTranslations["dashboard"]["live"];

function toneIconClass(tone: PosHubTone): string {
  if (tone === "ok") return "dashboard-icon--ok";
  if (tone === "attention") return "dashboard-icon--attention";
  if (tone === "action_required") return "dashboard-icon--action";
  return "dashboard-icon--muted";
}

function notifyRowClass(tone: PosHubTone): string {
  if (tone === "ok") return "dashboard-notify-row--ok";
  if (tone === "action_required") return "dashboard-notify-row--action";
  return "dashboard-notify-row--attention";
}

function storeStatusDotClass(tone: PosHubTone): string {
  if (tone === "ok") return "live-status-dot live-status-dot--ok";
  if (tone === "attention") return "live-status-dot live-status-dot--attention";
  if (tone === "action_required") return "live-status-dot live-status-dot--action";
  return "live-status-dot live-status-dot--muted";
}

function alertIcon(icon: BusinessAlert["icon"]) {
  switch (icon) {
    case "update":
      return Download;
    case "license":
      return Shield;
    case "fiscal":
      return FileText;
    case "device":
      return HardDrive;
    case "cloud":
      return Cloud;
    case "profile":
      return User;
    default:
      return RefreshCw;
  }
}

function activityIcon(kind: DashboardActivity["kind"]) {
  switch (kind) {
    case "invoice_paid":
    case "invoice_open":
      return Receipt;
    case "device_connected":
    case "pos_connected":
      return Monitor;
    case "license_activated":
      return FileText;
    case "cloud_synced":
      return Activity;
    default:
      return Circle;
  }
}

export function LiveDashboardSkeleton() {
  return (
    <div className="live-dashboard">
      <div className="dashboard-skeleton-block h-14 rounded-xl animate-pulse" />
      <div className="dashboard-kpi-grid dashboard-kpi-grid--five">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="dashboard-kpi dashboard-kpi--skeleton animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function LiveDashboardHeader({
  businessName,
  businessOnline,
  environmentLabel,
  locale,
  alertCount,
  onAlertsClick,
  l,
  onRefresh,
  refreshing = false,
  refreshLabel,
  refreshLoadingLabel,
  autoRefreshHint,
}: {
  businessName: string;
  businessOnline: boolean;
  environmentLabel: string;
  locale: string;
  alertCount: number;
  onAlertsClick: () => void;
  l: LiveCopy;
  onRefresh?: () => void;
  refreshing?: boolean;
  refreshLabel?: string;
  refreshLoadingLabel?: string;
  autoRefreshHint?: string;
}) {
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-main min-w-0">
        <p className="dashboard-eyebrow">{l.welcomeBack}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="dashboard-title truncate">{businessName}</h1>
          <span
            className={`dashboard-status-pill ${
              businessOnline ? "dashboard-status-pill--online" : "dashboard-status-pill--attention"
            }`}
          >
            {businessOnline ? l.businessOnline : l.businessNeedsAttention}
          </span>
        </div>
        <div className="dashboard-meta flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          <span>{environmentLabel}</span>
          <span aria-hidden>·</span>
          <span>{dateLabel}</span>
        </div>
      </div>
      <div className="dashboard-header-actions shrink-0">
        {onRefresh && refreshLabel ? (
          <div className="dashboard-header-refresh">
            {autoRefreshHint ? (
              <p className="portal-auto-refresh-hint dashboard-header-refresh-hint">
                {autoRefreshHint}
              </p>
            ) : null}
            <button
              type="button"
              className="portal-refresh-btn dashboard-icon-btn"
              disabled={refreshing}
              onClick={onRefresh}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : undefined} />
              <span>{refreshing && refreshLoadingLabel ? refreshLoadingLabel : refreshLabel}</span>
            </button>
          </div>
        ) : null}
        <div className="dashboard-search dashboard-search--disabled" title={l.searchFuture}>
          <Search size={14} />
          <span>{l.searchFuture}</span>
        </div>
        <button
          type="button"
          className="dashboard-icon-btn"
          onClick={onAlertsClick}
          aria-label={l.notifications}
        >
          <Bell size={16} />
          {alertCount > 0 ? <span className="dashboard-notify-badge">{alertCount}</span> : null}
        </button>
      </div>
    </header>
  );
}

export function LiveKpiStrip({
  kpis,
  loading,
  isLight,
  gridClassName = "dashboard-kpi-grid",
}: {
  kpis: DashboardKpi[];
  loading: boolean;
  isLight: boolean;
  gridClassName?: string;
}) {
  if (loading) {
    return (
      <div className={gridClassName}>
        {Array.from({ length: kpis.length || 5 }).map((_, i) => (
          <div key={i} className="dashboard-kpi dashboard-kpi--skeleton animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className={gridClassName}>
      {kpis.map((kpi) => {
        const hintClass = kpi.hintAccent
          ? "dashboard-kpi-hint dashboard-kpi-hint--update"
          : "dashboard-kpi-hint";

        const body = (
          <>
            <span className={portalSectionLabel(isLight)}>{kpi.label}</span>
            <span className="dashboard-kpi-value tabular-nums">{kpi.value}</span>
            {kpi.hint ? <span className={hintClass}>{kpi.hint}</span> : null}
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

export function StoreStatusWidget({
  items,
  title,
  loading = false,
  loadingLabel,
}: {
  items: LiveStoreStatusItem[];
  title: string;
  loading?: boolean;
  loadingLabel?: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      {loading ? (
        <p className="dashboard-text-muted">{loadingLabel ?? "…"}</p>
      ) : (
        <ul className="live-store-status-list">
          {items.map((item) => (
            <li key={item.id} className="live-store-status-row">
              <span className={storeStatusDotClass(item.tone)} aria-hidden />
              <span className="live-store-status-label">{item.label}</span>
              <span className={`live-store-status-value ${toneIconClass(item.tone)}`}>{item.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function BusinessAlertCenter({
  alerts,
  title,
  emptyLabel,
}: {
  alerts: BusinessAlert[];
  title: string;
  emptyLabel: string;
}) {
  return (
    <section id="business-alerts" className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{title}</h2>
      {alerts.length === 0 ? (
        <p className="dashboard-text-muted">{emptyLabel}</p>
      ) : (
        <ul className="live-alert-list">
          {alerts.map((alert) => {
            const Icon = alertIcon(alert.icon);
            const row = (
              <>
                <span className={`live-alert-icon ${toneIconClass(alert.severity)}`}>
                  <Icon size={14} />
                </span>
                <span className="live-alert-message">{alert.message}</span>
                {alert.actionLabel ? (
                  <span className="live-alert-action">{alert.actionLabel}</span>
                ) : null}
              </>
            );

            return (
              <li key={alert.id} className={`live-alert-row ${notifyRowClass(alert.severity)}`}>
                {alert.href ? (
                  alert.href.startsWith("#") ? (
                    <a href={alert.href} className="live-alert-link">
                      {row}
                    </a>
                  ) : (
                    <Link to={alert.href} className="live-alert-link">
                      {row}
                    </Link>
                  )
                ) : (
                  <div className="live-alert-link">{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function TodayActivityTimeline({
  items,
  locale,
  title,
  emptyLabel,
  compact = false,
  loading = false,
  loadingLabel,
}: {
  items: DashboardActivity[];
  locale: string;
  title: string;
  emptyLabel: string;
  compact?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}) {
  const listClass = compact
    ? "dashboard-activity-list dashboard-activity-list--compact"
    : "dashboard-activity-list";

  return (
    <section className={`dashboard-panel${compact ? " dashboard-panel--compact" : ""}`}>
      <h2 className="dashboard-panel-title">{title}</h2>
      {loading ? (
        <p className="dashboard-text-muted">{loadingLabel ?? "…"}</p>
      ) : items.length === 0 ? (
        <p className="dashboard-text-muted">{emptyLabel}</p>
      ) : (
        <ul className={listClass}>
          {items.map((item) => {
            const Icon = activityIcon(item.kind);
            const time = new Intl.DateTimeFormat(locale, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(item.at));

            const row = (
              <>
                <Icon size={14} className="dashboard-icon--muted" />
                <span className="dashboard-activity-label">{item.label}</span>
                <span className="dashboard-activity-time">{time}</span>
              </>
            );

            return (
              <li key={item.id}>
                {item.href ? (
                  <Link to={item.href} className="dashboard-activity-row">
                    {row}
                    <ChevronRight size={14} className="dashboard-icon--muted" />
                  </Link>
                ) : (
                  <div className="dashboard-activity-row">{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function DashboardQuickActions({
  actions,
  release,
  title,
}: {
  actions: DashboardQuickAction[];
  release: PosReleaseConfig;
  title: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <div className="dashboard-quick-actions">
        {actions.map((action) => {
          if (action.onClick === "desktop_protocol") {
            return (
              <button
                key={action.id}
                type="button"
                className="dashboard-quick-btn dashboard-quick-btn--primary"
                onClick={() => openDesktopPos(release)}
              >
                {action.label}
              </button>
            );
          }

          if (action.href) {
            if (action.external) {
              return (
                <a
                  key={action.id}
                  href={action.href}
                  className="dashboard-quick-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {action.label}
                  <ExternalLink size={12} className="dashboard-icon--muted" />
                </a>
              );
            }

            return (
              <Link key={action.id} to={action.href} className="dashboard-quick-btn">
                {action.label}
              </Link>
            );
          }

          return null;
        })}
      </div>
    </section>
  );
}

function remoteActionIcon(id: string) {
  switch (id) {
    case "desktop":
      return Monitor;
    case "restart_pos":
      return RotateCcw;
    case "force_sync":
      return RefreshCw;
    case "download_logs":
      return Download;
    case "restart_cloud":
      return Server;
    case "lock_pos":
      return Lock;
    default:
      return Circle;
  }
}

export function RemoteControlWidget({
  actions,
  release,
  title,
}: {
  actions: RemoteAction[];
  release: PosReleaseConfig;
  title: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <ul className="live-remote-list">
        {actions.map((action) => {
          const Icon = remoteActionIcon(action.id);
          const isPrimary = action.onClick === "desktop_protocol" && action.enabled;

          const content = (
            <>
              <span className={`live-remote-icon ${isPrimary ? "live-remote-icon--primary" : ""}`}>
                <Icon size={15} />
              </span>
              <span className="live-remote-body">
                <span className="live-remote-label">{action.label}</span>
                <span className="live-remote-desc">{action.description}</span>
              </span>
              {action.badge ? <span className="live-remote-badge">{action.badge}</span> : null}
            </>
          );

          if (action.onClick === "desktop_protocol" && action.enabled) {
            return (
              <li key={action.id}>
                <button
                  type="button"
                  className="live-remote-btn live-remote-btn--primary"
                  onClick={() => openDesktopPos(release)}
                >
                  {content}
                </button>
              </li>
            );
          }

          return (
            <li key={action.id}>
              <span className="live-remote-btn live-remote-btn--disabled" aria-disabled>
                {content}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function StoreSnapshotCard({
  snapshot,
  l,
}: {
  snapshot: StoreSnapshot;
  l: LiveCopy;
}) {
  const rows: Array<{ label: string; value: string; tone?: PosHubTone }> = [
    { label: l.snapshotStoreName, value: snapshot.storeName },
    { label: l.snapshotCountry, value: snapshot.country },
    { label: l.snapshotCurrency, value: snapshot.currency },
    { label: l.snapshotFiscalProvider, value: snapshot.fiscalProvider },
    { label: l.snapshotLicense, value: snapshot.license },
    { label: l.snapshotPosVersion, value: snapshot.posVersion },
    { label: l.snapshotEnvironment, value: snapshot.environment },
    { label: l.snapshotCloudStatus, value: snapshot.cloudStatus, tone: snapshot.cloudTone },
    { label: l.snapshotProfile, value: snapshot.profileStatus, tone: snapshot.profileTone },
  ];

  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{l.snapshotTitle}</h2>
      <dl className="live-snapshot-grid">
        {rows.map((row) => (
          <div key={row.label} className="live-snapshot-item">
            <dt className="live-snapshot-label">{row.label}</dt>
            <dd className={`live-snapshot-value ${row.tone ? toneIconClass(row.tone) : ""}`}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ConnectedDevicesWidget({
  devices,
  loading,
  l,
}: {
  devices: LiveDeviceCard[];
  loading: boolean;
  l: LiveCopy;
}) {
  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="dashboard-panel-title m-0">{l.devicesTitle}</h2>
        {devices.length > 0 ? (
          <Link to="/portal/devices" className="dashboard-quick-btn no-underline text-xs">
            {l.devicesViewAll}
            <ChevronRight size={12} />
          </Link>
        ) : null}
      </div>

      {loading ? (
        <p className="dashboard-text-muted">{l.waiting}</p>
      ) : devices.length === 0 ? (
        <div className="live-devices-empty">
          <HardDrive size={22} className="dashboard-icon--muted" aria-hidden />
          <p className="dashboard-health-score-label">{l.devicesEmpty}</p>
          <p className="dashboard-text-muted text-xs">{l.devicesEmptyHint}</p>
        </div>
      ) : (
        <div className="live-device-grid">
          {devices.map((device) => (
            <article key={device.id} className="live-device-card">
              <div className="live-device-head">
                <span className="live-device-name">{device.name}</span>
                <span className={`live-device-status ${toneIconClass(device.statusTone)}`}>
                  {device.status}
                </span>
              </div>
              <div className="live-device-meta">
                <span>{device.platform}</span>
                <span>v{device.version}</span>
                <span>{device.lastHeartbeat}</span>
                <span>{device.license}</span>
                <span>{device.environment}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function ReleaseCenterWidget({
  release,
  l,
}: {
  release: LiveReleaseCenter;
  l: LiveCopy;
}) {
  return (
    <section id="pos-release-center" className="dashboard-panel">
      <h2 className="dashboard-panel-title">{l.releaseCenterTitle}</h2>
      <div className="live-release-meta">
        <div>
          <div className="live-meta-label">{l.kpiPosVersion}</div>
          <div className="live-meta-value">{release.latestVersion}</div>
        </div>
        <div>
          <div className="live-meta-label">{l.snapshotPosVersion}</div>
          <div className="live-meta-value">{release.installedVersion}</div>
        </div>
        <div>
          <div className="live-meta-label">{l.releaseDateLabel}</div>
          <div className="live-meta-value">{release.releaseDate}</div>
        </div>
        <div>
          <div className="live-meta-label">{l.kpiPosStatus}</div>
          <div className={`live-meta-value ${toneIconClass(release.updateTone)}`}>
            {release.updateStatus}
          </div>
        </div>
      </div>
      <p className="dashboard-text-muted text-xs mt-2 leading-relaxed">{release.releaseNotes}</p>
      <p className="dashboard-text-muted text-xs mt-1">
        {release.installerSize} · {release.installerName}
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        {release.releaseNotesUrl ? (
          <a
            href={release.releaseNotesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dashboard-quick-btn no-underline"
          >
            {l.releaseNotes}
            <ExternalLink size={11} />
          </a>
        ) : null}
        <a
          href={release.downloadUrl}
          download={release.installerName}
          className="dashboard-quick-btn dashboard-quick-btn--primary no-underline"
        >
          <Download size={12} />
          {l.releaseDownload}
        </a>
      </div>
    </section>
  );
}

export function SystemHealthPanel({
  items,
  title,
}: {
  items: SystemHealthItem[];
  title: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <ul className="live-health-list">
        {items.map((item) => (
          <li key={item.id} className="live-health-row">
            <span
              className={`live-health-dot ${item.healthy ? "live-health-dot--ok" : "live-health-dot--muted"}`}
              aria-hidden
            />
            <span className="live-health-label">{item.label}</span>
            <span className={`live-health-value ${toneIconClass(item.tone)}`}>{item.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DashboardRecentOrders({
  orders,
  title,
  emptyLabel,
  columns,
  onlineBadgeLabel,
  loading = false,
  loadingLabel,
}: {
  orders: PortalDashboardRecentOrder[];
  title: string;
  emptyLabel: string;
  onlineBadgeLabel?: string;
  loading?: boolean;
  loadingLabel?: string;
  columns: {
    time: string;
    orderNumber: string;
    status: string;
    payment: string;
    amount: string;
    receipt: string;
  };
}) {
  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{title}</h2>
      {loading ? (
        <p className="dashboard-text-muted">{loadingLabel ?? "…"}</p>
      ) : orders.length === 0 ? (
        <p className="dashboard-text-muted">{emptyLabel}</p>
      ) : (
        <div className="orders-table-wrap">
          <table className="portal-table orders-table dashboard-recent-orders-table">
            <thead>
              <tr>
                <th>{columns.time}</th>
                <th>{columns.orderNumber}</th>
                <th>{columns.status}</th>
                <th>{columns.payment}</th>
                <th>{columns.receipt}</th>
                <th>{columns.amount}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.time}</td>
                  <td>
                    {order.orderNumber}
                    {order.isProviderOrder && onlineBadgeLabel ? (
                      <span className="order-online-chip">{onlineBadgeLabel}</span>
                    ) : null}
                  </td>
                  <td>
                    <OrderStatusBadge status={order.statusKey} label={order.status} />
                  </td>
                  <td>{order.payment}</td>
                  <td>{order.receiptNumber}</td>
                  <td>{order.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
