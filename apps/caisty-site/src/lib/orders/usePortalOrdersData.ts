import React from "react";
import { fetchPortalOrders, type PortalCustomer } from "../portalApi";
import type { OrdersData } from "./types";
import { usePortalSalesPolling } from "../portal/usePortalSalesPolling";

export type UsePortalOrdersDataResult = OrdersData & {
  reload: () => void;
  refreshing: boolean;
};

export function usePortalOrdersData(
  customer: PortalCustomer,
  options?: { pollingPaused?: boolean },
): UsePortalOrdersDataResult {
  const [state, setState] = React.useState<OrdersData>(() => ({
    customer,
    sales: null,
    loading: true,
    error: false,
    lastSyncedAt: null,
  }));
  const [tick, setTick] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const hasLoadedRef = React.useRef(false);

  const reload = React.useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  React.useEffect(() => {
    hasLoadedRef.current = false;
  }, [customer.id]);

  React.useEffect(() => {
    let cancelled = false;
    const isBackgroundRefresh = hasLoadedRef.current;

    if (isBackgroundRefresh) {
      setRefreshing(true);
    } else {
      setState((prev) => ({ ...prev, loading: true, error: false }));
    }

    (async () => {
      try {
        const sales = await fetchPortalOrders();
        if (cancelled) return;

        hasLoadedRef.current = true;
        setState({
          customer,
          sales,
          loading: false,
          error: false,
          lastSyncedAt: new Date(),
        });
      } catch {
        if (!cancelled) {
          hasLoadedRef.current = true;
          setState((prev) => ({
            ...prev,
            customer,
            sales: isBackgroundRefresh ? prev.sales : null,
            loading: false,
            error: true,
            lastSyncedAt: prev.lastSyncedAt,
          }));
        }
      } finally {
        if (!cancelled) {
          setRefreshing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customer, tick]);

  usePortalSalesPolling(reload, { paused: options?.pollingPaused ?? false });

  return { ...state, reload, refreshing };
}
