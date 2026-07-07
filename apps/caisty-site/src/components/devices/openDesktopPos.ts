import type { PosReleaseConfig } from "../../config/posConfig";

const DESKTOP_OPEN_TIMEOUT_MS = 1800;

/** Launch the installed Desktop POS via its custom protocol (no backend call). */
export function openDesktopPos(release: PosReleaseConfig) {
  if (typeof window === "undefined") return;
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = release.desktop.openUrl;
  document.body.appendChild(iframe);
  window.setTimeout(() => iframe.remove(), DESKTOP_OPEN_TIMEOUT_MS);
}
