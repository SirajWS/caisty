import { Download, ExternalLink } from "lucide-react";
import { PosInstallerDownloadAction } from "../pos/PosInstallerDownloadAction";
import type { PosHubTone } from "../../lib/posHub/types";
import type { VersionManagementView } from "../../lib/devices/types";

function toneClass(tone: PosHubTone): string {
  if (tone === "ok") return "dashboard-icon--ok";
  if (tone === "attention") return "dashboard-icon--attention";
  if (tone === "action_required") return "dashboard-icon--action";
  return "dashboard-icon--muted";
}

export function VersionManagement({
  version,
  labels,
  maintenanceMessage,
}: {
  version: VersionManagementView;
  labels: {
    title: string;
    latestVersion: string;
    installedVersion: string;
    updateAvailable: string;
    releaseDate: string;
    downloadInstaller: string;
    releaseNotes: string;
  };
  maintenanceMessage: string;
}) {
  return (
    <section className="dashboard-panel dashboard-panel--wide">
      <h2 className="dashboard-panel-title">{labels.title}</h2>
      <div className="devices-version-grid">
        <div className="devices-stat-card">
          <span className="devices-stat-label">{labels.latestVersion}</span>
          <span className="devices-stat-value tabular-nums">v{version.latestVersion}</span>
        </div>
        <div className="devices-stat-card">
          <span className="devices-stat-label">{labels.installedVersion}</span>
          <span className="devices-stat-value tabular-nums">{version.installedVersion}</span>
        </div>
        <div className="devices-stat-card">
          <span className="devices-stat-label">{labels.updateAvailable}</span>
          <span className={`devices-stat-value ${toneClass(version.updateTone)}`}>
            {version.updateAvailableLabel}
          </span>
        </div>
        <div className="devices-stat-card">
          <span className="devices-stat-label">{labels.releaseDate}</span>
          <span className="devices-stat-value">{version.releaseDate}</span>
        </div>
      </div>
      <div className="devices-version-actions">
        <PosInstallerDownloadAction
          downloadUrl={version.downloadUrl}
          label={labels.downloadInstaller}
          className="devices-remote-btn devices-remote-btn--primary no-underline"
          maintenanceMessage={maintenanceMessage}
        >
          <Download size={14} />
          {labels.downloadInstaller}
        </PosInstallerDownloadAction>
        {version.releaseNotesUrl ? (
          <a
            href={version.releaseNotesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="devices-remote-btn devices-remote-btn--secondary no-underline"
          >
            <ExternalLink size={14} />
            {labels.releaseNotes}
          </a>
        ) : (
          <p className="dashboard-text-muted text-xs m-0">{version.releaseNotes}</p>
        )}
      </div>
    </section>
  );
}
