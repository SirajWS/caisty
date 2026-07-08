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

export type UsePortalDashboardDataResult = DashboardData & {
  reload: () => void;
};

const emptySalesSummary = (): PortalDashboardSummary => ({
  timezone: "Europe/Berlin",
  period: "today",
  todayRevenueCents: 0,
  ordersToday: 0,
  receiptsToday: 0,
  currency: "EUR",
  lastSynchronizationAt: null,
  hasSalesData: false,
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

  const reload = React.useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setState((prev) => ({ ...prev, loading: true, error: false }));
      let hadError = false;

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
            return emptySalesSummary();
          }),
        ]);

        if (cancelled) return;

        setState({
          licenses,
          devices,
          invoices,
          business,
          salesSummary,
          customer,
          loading: false,
          error: hadError,
          lastSyncedAt: new Date(),
        });
      } catch {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: true,
            lastSyncedAt: new Date(),
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customer, tick]);

  return { ...state, reload };
}
