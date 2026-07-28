import { useEffect } from "react";

import { runSyncCycle } from "../sync/syncEngine.js";

const SYNC_INTERVAL_MS = 2 * 60 * 1000;

export function useSyncWorker() {
  useEffect(() => {
    void runSyncCycle();

    const onOnline = () => {
      void runSyncCycle();
    };

    window.addEventListener("online", onOnline);
    const intervalId = window.setInterval(() => {
      void runSyncCycle();
    }, SYNC_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", onOnline);
      window.clearInterval(intervalId);
    };
  }, []);
}
