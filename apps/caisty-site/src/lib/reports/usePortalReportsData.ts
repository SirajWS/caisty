import React from "react";
import {
  fetchPortalDevices,
  fetchPortalReportsSummary,
  type PortalCustomer,
  type PortalReportsSummary,
} from "../portalApi";
import {
  mapReportsPeriodToApi,
  type ReportsPeriodId,
} from "./reportsPeriod";
import type { ReportsData } from "./types";

export type UsePortalReportsDataResult = ReportsData & {
  reload: () => void;
};

const emptyReportsSummary = (): PortalReportsSummary => ({
  timezone: "Europe/Berlin",
  period: "today",
  hasSalesData: false,
  overview: {
    revenueMinor: 0,
    ordersCount: 0,
    receiptsCount: 0,
    refundsCount: 0,
    averageOrderMinor: 0,
    vatMinor: 0,
    currency: "EUR",
  },
  posRevenueCents: 0,
  onlineRevenueCents: 0,
  liveOrdersCount: 0,
  onlineOrdersCount: 0,
  revenueSeries: [],
  salesByHour: [],
  paymentMethods: {
    cashMinor: 0,
    cardMinor: 0,
    voucherMinor: 0,
    otherMinor: 0,
    currency: "EUR",
  },
  onlinePaymentSummary: {
    cashPaidCents: 0,
    cardPaidCents: 0,
    onlinePaidCents: 0,
    pendingCents: 0,
    currency: "EUR",
  },
  topProducts: [],
  topEmployees: [],
  taxes: {
    netRevenueMinor: 0,
    vatMinor: 0,
    grossRevenueMinor: 0,
    fiscalReceiptsCount: 0,
    currency: "EUR",
  },
  businessTrends: {
    bestSalesDay: null,
    bestSalesHour: null,
    largestReceiptMinor: 0,
    mostUsedPayment: null,
    mostSoldProduct: null,
    currency: "EUR",
  },
});

const initialData = (
  customer: PortalCustomer,
  period: ReportsPeriodId,
): Omit<ReportsData, "loading" | "error" | "lastSyncedAt"> => ({
  devices: [],
  reportsSummary: null,
  customer,
  period,
});

export function usePortalReportsData(
  customer: PortalCustomer,
  period: ReportsPeriodId,
): UsePortalReportsDataResult {
  const [state, setState] = React.useState<ReportsData>(() => ({
    ...initialData(customer, period),
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
      setState((prev) => ({
        ...prev,
        loading: true,
        error: false,
        period,
      }));
      let hadError = false;
      const apiPeriod = mapReportsPeriodToApi(period);

      try {
        const [devices, reportsSummary] = await Promise.all([
          fetchPortalDevices().catch(() => {
            hadError = true;
            return [];
          }),
          fetchPortalReportsSummary(apiPeriod).catch(() => {
            hadError = true;
            return emptyReportsSummary();
          }),
        ]);

        if (cancelled) return;

        setState({
          devices,
          reportsSummary,
          customer,
          period,
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
  }, [customer, period, tick]);

  return { ...state, reload };
}
