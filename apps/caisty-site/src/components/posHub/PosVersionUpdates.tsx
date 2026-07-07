import type { PortalTranslations } from "../../lib/translations/portal";
import type { PosReleaseConfig } from "../../config/posConfig";
import type { PosHubDerivedState } from "../../lib/posHub/types";
import { formatInstallerBytes } from "../../lib/posHub/format";

export function PosVersionUpdates({
  hub,
  release,
  p,
  locale,
}: {
  hub: PosHubDerivedState;
  release: PosReleaseConfig;
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
    <section id="pos-version-updates" className="dashboard-panel dashboard-panel--wide pos-version-panel scroll-mt-20">
      <h2 className="dashboard-panel-title">{p.sectionVersionUpdates}</h2>
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
          <div className="pos-hub-meta-label">{p.updateStatus}</div>
          <div className="pos-hub-meta-value">{hub.version.updateStatusLabel}</div>
        </div>
        <div>
          <div className="pos-hub-meta-label">{p.releaseDate}</div>
          <div className="pos-hub-meta-value">{releaseDate}</div>
        </div>
      </div>
      <p className="pos-version-notes">{notes}</p>
      <p className="pos-version-meta-line">
        {p.installerSize}: {sizeLabel} · {release.installer.fileName}
      </p>
      {release.releaseNotesUrl ? (
        <div className="pos-version-links">
          <a
            href={release.releaseNotesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dashboard-quick-btn no-underline"
          >
            {p.releaseNotesView}
          </a>
        </div>
      ) : null}
    </section>
  );
}
