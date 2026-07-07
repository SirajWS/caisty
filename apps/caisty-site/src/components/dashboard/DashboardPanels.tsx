import React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Bell,
  Check,
  ChevronRight,
  Circle,
  ExternalLink,
  FileText,
  HardDrive,
  LayoutGrid,
  Monitor,
  Package,
  Receipt,
  Search,
  Users,
} from "lucide-react";
import type { PortalTranslations } from "../../lib/translations/portal";
import type { PosHubNotification, PosHubTone } from "../../lib/posHub/types";
import type {
  DashboardActivity,
  DashboardKpi,
  DashboardQuickAction,
  DashboardRoadmapModule,
} from "../../lib/dashboard/types";
import type { PosReleaseConfig } from "../../config/posConfig";
import { portalSectionLabel } from "../../lib/portalUi";

const DESKTOP_OPEN_TIMEOUT_MS = 1800;

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

export function DashboardSkeleton() {
  return (
    <div className="dashboard-home space-y-4">
      <div className="dashboard-skeleton-block h-14 rounded-xl animate-pulse" />
      <div className="dashboard-kpi-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="dashboard-kpi dashboard-kpi--skeleton animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function DashboardHeader({
  businessName,
  businessOnline,
  environmentLabel,
  locale,
  notificationCount,
  onNotificationsClick,
  h,
}: {
  businessName: string;
  businessOnline: boolean;
  environmentLabel: string;
  locale: string;
  notificationCount: number;
  onNotificationsClick: () => void;
  h: PortalTranslations["dashboard"]["home"];
}) {
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-main min-w-0">
        <p className="dashboard-eyebrow">{h.welcomeBack}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="dashboard-title truncate">{businessName}</h1>
          <span
            className={`dashboard-status-pill ${
              businessOnline ? "dashboard-status-pill--online" : "dashboard-status-pill--attention"
            }`}
          >
            {businessOnline ? h.businessOnline : h.businessNeedsAttention}
          </span>
        </div>
        <div className="dashboard-meta flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          <span>{environmentLabel}</span>
          <span aria-hidden>·</span>
          <span>{dateLabel}</span>
        </div>
      </div>

      <div className="dashboard-header-actions shrink-0">
        <div className="dashboard-search dashboard-search--disabled" title={h.searchFuture}>
          <Search size={14} />
          <span>{h.searchFuture}</span>
        </div>
        <button
          type="button"
          className="dashboard-icon-btn"
          onClick={onNotificationsClick}
          aria-label={h.notifications}
        >
          <Bell size={16} />
          {notificationCount > 0 ? (
            <span className="dashboard-notify-badge">{notificationCount}</span>
          ) : null}
        </button>
      </div>
    </header>
  );
}

function KpiCard({ kpi, isLight }: { kpi: DashboardKpi; isLight: boolean }) {
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
      <Link to={kpi.href} className="dashboard-kpi dashboard-kpi--link">
        {body}
      </Link>
    );
  }

  return <div className="dashboard-kpi">{body}</div>;
}

export function DashboardKpiRow({
  kpis,
  loading,
  isLight,
}: {
  kpis: DashboardKpi[];
  loading: boolean;
  isLight: boolean;
}) {
  if (loading) {
    return (
      <div className="dashboard-kpi-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="dashboard-kpi dashboard-kpi--skeleton animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="dashboard-kpi-grid">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} isLight={isLight} />
      ))}
    </div>
  );
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

export function DashboardHealthPanel({
  score,
  items,
  h,
}: {
  score: number;
  items: { id: string; label: string; done: boolean; tone: PosHubTone }[];
  h: PortalTranslations["dashboard"]["home"];
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{h.healthTitle}</h2>
      <div className="dashboard-health-layout">
        <div className="dashboard-health-score">
          <ProgressRing score={score} />
          <div>
            <p className="dashboard-health-score-label">{h.healthReady}</p>
            <p className="dashboard-health-score-sub">{score}%</p>
          </div>
        </div>
        <ul className="dashboard-health-list">
          {items.map((item) => (
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
    </section>
  );
}

function openDesktopPos(release: PosReleaseConfig) {
  if (typeof window === "undefined") return;
  const url = release.desktop.openUrl;
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url;
  document.body.appendChild(iframe);
  window.setTimeout(() => iframe.remove(), DESKTOP_OPEN_TIMEOUT_MS);
}

export function DashboardQuickActions({
  actions,
  release,
  h,
}: {
  actions: DashboardQuickAction[];
  release: PosReleaseConfig;
  h: PortalTranslations["dashboard"]["home"];
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{h.quickActions}</h2>
      <div className="dashboard-quick-actions">
        {actions.map((action) => {
          const isPrimary = action.onClick === "desktop_protocol" && !action.disabled;
          const className = `dashboard-quick-btn ${
            action.disabled
              ? "dashboard-quick-btn--disabled"
              : isPrimary
                ? "dashboard-quick-btn--primary"
                : ""
          }`;

          const content = (
            <>
              <span>{action.label}</span>
              {action.badge ? <span className="dashboard-quick-badge">{action.badge}</span> : null}
            </>
          );

          if (action.onClick === "desktop_protocol" && !action.disabled) {
            return (
              <button key={action.id} type="button" className={className} onClick={() => openDesktopPos(release)}>
                {content}
              </button>
            );
          }

          if (action.href && !action.disabled) {
            if (action.external) {
              return (
                <a
                  key={action.id}
                  href={action.href}
                  className={`${className} no-underline`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {content}
                  <ExternalLink size={12} className="opacity-60" />
                </a>
              );
            }
            return (
              <Link key={action.id} to={action.href} className={`${className} no-underline`}>
                {content}
              </Link>
            );
          }

          return (
            <span key={action.id} className={className} aria-disabled>
              {content}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function activityIcon(kind: DashboardActivity["kind"]) {
  switch (kind) {
    case "invoice_paid":
    case "invoice_open":
      return Receipt;
    case "device_connected":
      return HardDrive;
    case "license_activated":
      return FileText;
    case "cloud_synced":
      return Activity;
    default:
      return Circle;
  }
}

export function DashboardRecentActivity({
  items,
  locale,
  emptyLabel,
  title,
}: {
  items: DashboardActivity[];
  locale: string;
  emptyLabel: string;
  title: string;
}) {
  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{title}</h2>
      {items.length === 0 ? (
        <p className="dashboard-text-muted">{emptyLabel}</p>
      ) : (
        <ul className="dashboard-activity-list">
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

export function DashboardNotifications({
  items,
  title,
  emptyLabel,
}: {
  items: PosHubNotification[];
  title: string;
  emptyLabel: string;
}) {
  return (
    <section id="dashboard-notifications" className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{title}</h2>
      {items.length === 0 ? (
        <p className="dashboard-text-muted">{emptyLabel}</p>
      ) : (
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
      )}
    </section>
  );
}

const roadmapIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  pos: Monitor,
  reports: LayoutGrid,
  inventory: Package,
  employees: Users,
  web_pos: Monitor,
  crm: Users,
};

export function DashboardRoadmap({
  modules,
  title,
  comingSoonLabel,
}: {
  modules: DashboardRoadmapModule[];
  title: string;
  comingSoonLabel: string;
}) {
  return (
    <section className="dashboard-roadmap">
      <h2 className="dashboard-panel-title mb-2">{title}</h2>
      <div className="dashboard-roadmap-grid">
        {modules.map((mod) => {
          const Icon = roadmapIcons[mod.id] ?? LayoutGrid;
          const card = (
            <>
              <Icon size={16} className="dashboard-roadmap-icon" />
              <span className="dashboard-roadmap-label">{mod.label}</span>
              {!mod.available ? (
                <span className="dashboard-roadmap-badge">{comingSoonLabel}</span>
              ) : null}
            </>
          );

          if (mod.available) {
            return (
              <Link key={mod.id} to={mod.href} className="dashboard-roadmap-card dashboard-roadmap-card--available">
                {card}
              </Link>
            );
          }

          return (
            <div key={mod.id} className="dashboard-roadmap-card dashboard-roadmap-card--locked" aria-disabled>
              {card}
            </div>
          );
        })}
      </div>
    </section>
  );
}
