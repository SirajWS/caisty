import React from "react";
import {
  fetchPortalDevices,
  fetchPortalReportsSummary,
  type PortalCustomer,
  type PortalReportsSummary,
} from "../portalApi";
import {
  mapReportsPeriodToApi,
  type AppliedReportsPeriod,
} from "./reportsPeriod";
import type { ReportsData } from "./types";

export type UsePortalReportsDataResult = ReportsData & {
  reload: () => void;
};

const emptyReportsSummary = (): PortalReportsSummary => ({
  timezone: "Europe/Berlin",
  period: "today",
  hasSalesData: false,
  mixedCurrency: false,
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

function isIncompatibleCustomResponse(
  applied: AppliedReportsPeriod,
  summary: PortalReportsSummary,
): boolean {
  if (applied.period !== "custom") return false;
  if (summary.period !== "custom") return true;
  return summary.from !== applied.from || summary.to !== applied.to;
}

/** Drop previous summary immediately so charts never show old numbers for a new range. */
export function beginReportsFetchState(
  prev: ReportsData,
  requestApplied: AppliedReportsPeriod,
): ReportsData {
  return {
    ...prev,
    loading: true,
    error: false,
    incompatibleApi: false,
    period: requestApplied.period,
    applied: requestApplied,
    reportsSummary: null,
  };
}

export function usePortalReportsData(
  customer: PortalCustomer,
  applied: AppliedReportsPeriod,
): UsePortalReportsDataResult {
  const [state, setState] = React.useState<ReportsData>(() => ({
    devices: [],
    reportsSummary: null,
    customer,
    period: applied.period,
    applied,
    incompatibleApi: false,
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
    const requestApplied = applied;

    (async () => {
      setState((prev) => beginReportsFetchState(prev, requestApplied));
      let hadError = false;
      const apiQuery = mapReportsPeriodToApi(requestApplied);

      try {
        const [devices, reportsSummary] = await Promise.all([
          fetchPortalDevices().catch(() => {
            hadError = true;
            return [];
          }),
          fetchPortalReportsSummary(
            apiQuery.period,
            apiQuery.from && apiQuery.to
              ? { from: apiQuery.from, to: apiQuery.to }
              : undefined,
          ).catch(() => {
            hadError = true;
            return emptyReportsSummary();
          }),
        ]);

        if (cancelled) return;

        const incompatibleApi = !hadError
          ? isIncompatibleCustomResponse(requestApplied, reportsSummary)
          : false;

        setState({
          devices,
          reportsSummary: incompatibleApi ? null : reportsSummary,
          customer,
          period: requestApplied.period,
          applied: requestApplied,
          incompatibleApi,
          loading: false,
          error: hadError || incompatibleApi,
          lastSyncedAt: new Date(),
        });
      } catch {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: true,
            incompatibleApi: false,
            lastSyncedAt: new Date(),
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customer, applied, tick]);

  return { ...state, reload };
}
