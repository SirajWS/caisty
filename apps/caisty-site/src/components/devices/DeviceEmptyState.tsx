import { HardDrive, Monitor } from "lucide-react";
import type { PosReleaseConfig } from "../../config/posConfig";

const DESKTOP_OPEN_TIMEOUT_MS = 1800;

function openDesktopPos(release: PosReleaseConfig) {
  if (typeof window === "undefined") return;
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = release.desktop.openUrl;
  document.body.appendChild(iframe);
  window.setTimeout(() => iframe.remove(), DESKTOP_OPEN_TIMEOUT_MS);
}

export function DeviceEmptyState({
  headline,
  description,
  ctaLabel,
  release,
}: {
  headline: string;
  description: string;
  ctaLabel: string;
  release: PosReleaseConfig;
}) {
  return (
    <section className="devices-empty-state dashboard-panel dashboard-panel--wide">
      <div className="devices-empty-icon" aria-hidden>
        <HardDrive size={32} className="dashboard-icon--muted" />
      </div>
      <h2 className="devices-empty-headline">{headline}</h2>
      <p className="devices-empty-desc">{description}</p>
      <button
        type="button"
        className="devices-empty-cta"
        onClick={() => openDesktopPos(release)}
      >
        <Monitor size={16} />
        {ctaLabel}
      </button>
    </section>
  );
}
