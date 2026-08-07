import { Download, ExternalLink, Monitor } from "lucide-react";
import type { PortalTranslations } from "../../lib/translations/portal";
import type { PosReleaseConfig } from "../../config/posConfig";
import { useOpenDesktopPos } from "./useOpenDesktopPos";

export function PosMainActions({
  release,
  p,
}: {
  release: PosReleaseConfig;
  p: PortalTranslations["pos"];
}) {
  const { openDesktop, desktopFallback, desktopMobileHint } = useOpenDesktopPos(release);

  return (
    <section className="dashboard-panel dashboard-panel--wide pos-actions-panel">
      <h2 className="dashboard-panel-title">{p.mainActionsTitle}</h2>
      <div className="pos-hub-action-grid">
        <div className="pos-hub-action-card pos-hub-action-card--primary">
          <span className="pos-hub-action-icon">
            <Monitor size={18} />
          </span>
          <h3 className="pos-hub-action-title">{p.openDesktopPos}</h3>
          <p className="pos-hub-action-desc">{p.openDesktopPosDesc}</p>
          {desktopFallback ? (
            <p
              className="pos-hub-action-hint dashboard-notify-row dashboard-notify-row--attention"
              role="status"
            >
              {p.desktopNotInstalled}
            </p>
          ) : null}
          {desktopMobileHint ? (
            <p className="pos-hub-action-hint dashboard-notify-row" role="status">
              {p.desktopWindowsOnly}
            </p>
          ) : null}
          <button
            type="button"
            onClick={openDesktop}
            className="pos-hub-action-btn pos-hub-action-btn--primary"
          >
            {desktopFallback ? p.tryAgain : p.openDesktopPos}
          </button>
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

        <div className="pos-hub-action-card">
          <span className="pos-hub-action-icon">
            <ExternalLink size={18} />
          </span>
          <h3 className="pos-hub-action-title">{p.webCardTitle}</h3>
          <p className="pos-hub-action-desc">{p.webCardDesc}</p>
          {release.web.enabled && release.web.url ? (
            <a
              href={release.web.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pos-hub-action-btn no-underline"
            >
              {p.webCardButton}
            </a>
          ) : (
            <button type="button" disabled className="pos-hub-action-btn" aria-disabled>
              {p.statusComingSoon}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
