import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchPortalDeviceManagement,
  PortalDeviceApiError,
  runPortalDeviceAction,
  type PortalDeviceActionKind,
  type PortalDeviceManagementResponse,
} from "./portalDeviceApi";

export type UsePortalDeviceManagementResult = {
  data: PortalDeviceManagementResponse | null;
  loading: boolean;
  refreshing: boolean;
  error: PortalDeviceApiError | null;
  reload: () => Promise<void>;
  runAction: (
    deviceId: string,
    action: PortalDeviceActionKind,
  ) => Promise<void>;
  actionBusyDeviceId: string | null;
};

export function usePortalDeviceManagement(): UsePortalDeviceManagementResult {
  const [data, setData] = useState<PortalDeviceManagementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<PortalDeviceApiError | null>(null);
  const [actionBusyDeviceId, setActionBusyDeviceId] = useState<string | null>(
    null,
  );
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    const isInitial = data === null && loading;
    if (!isInitial) setRefreshing(true);
    setError(null);
    try {
      const next = await fetchPortalDeviceManagement();
      if (mounted.current) {
        setData(next);
      }
    } catch (err) {
      if (mounted.current) {
        setError(
          err instanceof PortalDeviceApiError
            ? err
            : new PortalDeviceApiError({
                message: "Failed to load devices.",
                httpStatus: 0,
              }),
        );
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [data, loading]);

  useEffect(() => {
    void reload();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initial load only

  const runAction = useCallback(
    async (deviceId: string, action: PortalDeviceActionKind) => {
      if (actionBusyDeviceId) return;
      setActionBusyDeviceId(deviceId);
      try {
        await runPortalDeviceAction(deviceId, action);
        await reload();
      } finally {
        if (mounted.current) {
          setActionBusyDeviceId(null);
        }
      }
    },
    [actionBusyDeviceId, reload],
  );

  return {
    data,
    loading,
    refreshing,
    error,
    reload,
    runAction,
    actionBusyDeviceId,
  };
}
