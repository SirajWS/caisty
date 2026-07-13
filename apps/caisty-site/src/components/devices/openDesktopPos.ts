import type { PosReleaseConfig } from "../../config/posConfig";

const DESKTOP_OPEN_TIMEOUT_MS = 1800;

/** Launch Desktop POS (local HTTP in dev, custom protocol in production). */
export function openDesktopPos(release: PosReleaseConfig) {
  if (typeof window === "undefined") return;

  if (import.meta.env.DEV) {
    window.open(release.desktop.openUrl, "_blank", "noopener,noreferrer");
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = release.desktop.openUrl;
  document.body.appendChild(iframe);
  window.setTimeout(() => iframe.remove(), DESKTOP_OPEN_TIMEOUT_MS);
}
