import React from "react";
import type { PosReleaseConfig } from "../../config/posConfig";

const DESKTOP_OPEN_TIMEOUT_MS = 1800;

function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function useOpenDesktopPos(release: PosReleaseConfig) {
  const [desktopFallback, setDesktopFallback] = React.useState(false);
  const [desktopMobileHint, setDesktopMobileHint] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  function openDesktop() {
    setDesktopFallback(false);
    setDesktopMobileHint(false);
    if (isMobileUserAgent()) {
      setDesktopMobileHint(true);
      return;
    }
    const onBlur = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      window.removeEventListener("blur", onBlur);
      setDesktopFallback(false);
    };
    window.addEventListener("blur", onBlur);
    timerRef.current = window.setTimeout(() => {
      window.removeEventListener("blur", onBlur);
      timerRef.current = null;
      setDesktopFallback(true);
    }, DESKTOP_OPEN_TIMEOUT_MS);
    window.location.href = release.desktop.openUrl;
  }

  return { openDesktop, desktopFallback, desktopMobileHint };
}
