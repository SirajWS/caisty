import { BarChart3, Monitor } from "lucide-react";
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

export function ReportsEmptyState({
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
    <section className="orders-empty-state dashboard-panel dashboard-panel--wide">
      <div className="orders-empty-icon" aria-hidden>
        <BarChart3 size={32} className="dashboard-icon--muted" />
      </div>
      <h2 className="orders-empty-headline">{headline}</h2>
      <p className="orders-empty-desc">{description}</p>
      <button
        type="button"
        className="orders-empty-cta"
        onClick={() => openDesktopPos(release)}
      >
        <Monitor size={16} />
        {ctaLabel}
      </button>
    </section>
  );
}
