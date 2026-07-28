import { useCallback, useEffect, useState } from "react";

import {
  EVT_ORDERS_CHANGED,
  EVT_RECEIPT_EVENTS_CHANGED,
  EVT_SALES_CHANGED,
  EVT_SHIFTS_CHANGED,
  EVT_SYNC_OUTBOX_CHANGED,
} from "@caisty/pos-sync-core";

import { readLocalCounts } from "../sync/localRepository.js";
import { outbox, runSyncCycle } from "../sync/syncEngine.js";

export function useSyncData() {
  const [counts, setCounts] = useState(() => readLocalCounts(outbox));
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const refresh = useCallback(() => {
    setCounts(readLocalCounts(outbox));
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await runSyncCycle();
      if (result.ok) {
        setLastSync(new Date().toISOString());
      }
      refresh();
      return result;
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  useEffect(() => {
    const events = [
      EVT_ORDERS_CHANGED,
      EVT_SALES_CHANGED,
      EVT_RECEIPT_EVENTS_CHANGED,
      EVT_SHIFTS_CHANGED,
      EVT_SYNC_OUTBOX_CHANGED,
    ];
    const handler = () => refresh();
    for (const name of events) {
      window.addEventListener(name, handler);
    }
    return () => {
      for (const name of events) {
        window.removeEventListener(name, handler);
      }
    };
  }, [refresh]);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      void runSyncCycle().then(() => refresh());
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh]);

  return { counts, lastSync, syncing, online, syncNow, refresh };
}
