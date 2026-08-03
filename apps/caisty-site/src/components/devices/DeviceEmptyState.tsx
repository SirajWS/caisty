import { Download, HardDrive, Monitor } from "lucide-react";
import type { PosReleaseConfig } from "../../config/posConfig";
import { PosInstallerDownloadAction } from "../pos/PosInstallerDownloadAction";
import { openDesktopPos } from "./openDesktopPos";

export function DeviceEmptyState({
  headline,
  description,
  ctaLabel,
  downloadLabel,
  maintenanceMessage,
  release,
}: {
  headline: string;
  description: string;
  ctaLabel: string;
  downloadLabel: string;
  maintenanceMessage: string;
  release: PosReleaseConfig;
}) {
  return (
    <section className="devices-empty-state dashboard-panel dashboard-panel--wide">
      <div className="devices-empty-icon" aria-hidden>
        <HardDrive size={32} className="dashboard-icon--muted" />
      </div>
      <h2 className="devices-empty-headline">{headline}</h2>
      <p className="devices-empty-desc">{description}</p>
      <div className="devices-empty-actions">
        <button
          type="button"
          className="devices-empty-cta"
          onClick={() => openDesktopPos(release)}
        >
          <Monitor size={16} />
          {ctaLabel}
        </button>
        <PosInstallerDownloadAction
          downloadUrl={release.installer.downloadUrl}
          fileName={release.installer.fileName}
          label={downloadLabel}
          className="devices-empty-download"
          maintenanceMessage={maintenanceMessage}
        >
          <Download size={16} />
          {downloadLabel}
        </PosInstallerDownloadAction>
      </div>
    </section>
  );
}
