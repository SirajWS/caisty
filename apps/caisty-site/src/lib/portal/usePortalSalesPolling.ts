import React from "react";

const PORTAL_SALES_POLL_MS = 30_000;

/**
 * Shared 30s polling for portal sales surfaces (orders, dashboard).
 * Skips overlapping reloads and pauses while `paused` is true.
 */
export function usePortalSalesPolling(
  reload: () => void,
  options?: { paused?: boolean; intervalMs?: number },
): void {
  const paused = options?.paused ?? false;
  const intervalMs = options?.intervalMs ?? PORTAL_SALES_POLL_MS;
  const inFlightRef = React.useRef(false);
  const reloadRef = React.useRef(reload);

  React.useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  React.useEffect(() => {
    if (paused) return;

    const intervalId = window.setInterval(() => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      reloadRef.current();
      window.setTimeout(() => {
        inFlightRef.current = false;
      }, 500);
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [paused, intervalMs]);
}

export { PORTAL_SALES_POLL_MS };
