import React from "react";
import {
  fetchPortalOrders,
  type PortalCustomer,
  type PortalOrdersResponse,
} from "../portalApi";
import type { OrdersData } from "./types";

export type UsePortalOrdersDataResult = OrdersData & {
  reload: () => void;
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

  const reload = React.useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setState((prev) => ({ ...prev, loading: true, error: false }));

      try {
        const sales = await fetchPortalOrders();
        if (cancelled) return;

        setState({
          customer,
          sales,
          loading: false,
          error: false,
          lastSyncedAt: new Date(),
        });
      } catch {
        if (!cancelled) {
          setState({
            customer,
            sales: emptySales(),
            loading: false,
            error: true,
            lastSyncedAt: new Date(),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customer, tick]);

  return { ...state, reload };
}
