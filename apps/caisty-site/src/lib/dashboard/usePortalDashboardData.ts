import React from "react";
import {
  fetchPortalBusiness,
  fetchPortalDashboardSummary,
  fetchPortalDevices,
  fetchPortalInvoices,
  fetchPortalLicenses,
  type PortalCustomer,
  type PortalDashboardSummary,
} from "../portalApi";
import type { DashboardData } from "./types";
import { usePortalSalesPolling } from "../portal/usePortalSalesPolling";

export type UsePortalDashboardDataResult = DashboardData & {
  reload: () => void;
  refreshing: boolean;
};

const emptySalesSummary = (): PortalDashboardSummary => ({
  timezone: "Europe/Berlin",
  period: "today",
  todayRevenueCents: 0,
  posRevenueCents: 0,
  onlineRevenueCents: 0,
  ordersToday: 0,
  liveOrdersCount: 0,
  onlineOrdersCount: 0,
  receiptsToday: 0,
  refundsCount: 0,
  averageOrderMinor: 0,
  currency: "EUR",
  lastSynchronizationAt: null,
  hasSalesData: false,
  paymentSummary: {
    cashCents: 0,
    cardCents: 0,
    voucherCents: 0,
    otherCents: 0,
    currency: "EUR",
  },
  recentOrders: [],
});

const initialData = (
  customer: PortalCustomer,
): Omit<DashboardData, "loading" | "error" | "lastSyncedAt"> => ({
  licenses: [],
  devices: [],
  invoices: [],
  business: null,
  customer,
  salesSummary: null,
  salesSummaryError: false,
});

export function usePortalDashboardData(
  customer: PortalCustomer,
): UsePortalDashboardDataResult {
  const [state, setState] = React.useState<DashboardData>(() => ({
    ...initialData(customer),
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
      let hadError = false;
      let salesSummaryError = false;

      try {
        const [licenses, devices, invoices, business, salesSummary] =
          await Promise.all([
          fetchPortalLicenses().catch(() => {
            hadError = true;
            return [];
          }),
          fetchPortalDevices().catch(() => {
            hadError = true;
            return [];
          }),
          fetchPortalInvoices().catch(() => []),
          fetchPortalBusiness().catch(() => {
            hadError = true;
            return null;
          }),
          fetchPortalDashboardSummary().catch(() => {
            hadError = true;
            salesSummaryError = true;
            return emptySalesSummary();
          }),
        ]);

        if (cancelled) return;

        hasLoadedRef.current = true;
        setState({
          licenses,
          devices,
          invoices,
          business,
          salesSummary,
          salesSummaryError,
          customer,
          loading: false,
          error: hadError,
          lastSyncedAt: new Date(),
        });
      } catch {
        if (!cancelled) {
          hasLoadedRef.current = true;
          setState((prev) => ({
            ...prev,
            loading: false,
            error: true,
            salesSummaryError: true,
            lastSyncedAt: new Date(),
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

  usePortalSalesPolling(reload, { paused: state.loading || refreshing });

  return { ...state, reload, refreshing };
}
