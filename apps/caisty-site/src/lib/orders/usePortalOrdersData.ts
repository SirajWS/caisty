import React from "react";
import {
  fetchPortalOrders,
  type PortalCustomer,
  type PortalOrdersResponse,
} from "../portalApi";
import type { OrdersData } from "./types";

export type UsePortalOrdersDataResult = OrdersData & {
  reload: () => void;
  refreshing: boolean;
};

const emptySales = (): PortalOrdersResponse => ({
  timezone: "Europe/Berlin",
  period: "today",
  summary: {
    ordersCount: 0,
    receiptsCount: 0,
    refundsCount: 0,
    openShift: null,
    paymentSummary: {
      cashCents: 0,
      cardCents: 0,
      voucherCents: 0,
      otherCents: 0,
      currency: "EUR",
    },
  },
  orders: [],
  receipts: [],
});

export function usePortalOrdersData(
  customer: PortalCustomer,
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
          setState({
            customer,
            sales: emptySales(),
            loading: false,
            error: true,
            lastSyncedAt: new Date(),
          });
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

  return { ...state, reload, refreshing };
}
