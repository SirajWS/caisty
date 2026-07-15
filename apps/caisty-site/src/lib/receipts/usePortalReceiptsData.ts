import React from "react";
import {
  fetchPortalReceiptDetail,
  fetchPortalReceipts,
  type PortalCustomer,
  type PortalReceiptDetailResponse,
  type PortalReceiptsResponse,
} from "../portalApi";
import type { ReceiptsData } from "./types";
import type {
  ReceiptsPaymentFilter,
  ReceiptsPeriodId,
  ReceiptsSortId,
  ReceiptsStatusFilter,
} from "./receiptsPeriod";
import {
  DEFAULT_RECEIPTS_PERIOD,
  DEFAULT_RECEIPTS_SORT,
  mapReceiptsPeriodToApi,
} from "./receiptsPeriod";
import { PORTAL_RECEIPTS_PAGE_SIZE } from "../portal/portalPagination";

export type ReceiptsQueryState = {
  period: ReceiptsPeriodId;
  paymentMethod: ReceiptsPaymentFilter;
  status: ReceiptsStatusFilter;
  search: string;
  sort: ReceiptsSortId;
  page: number;
};

export type UsePortalReceiptsDataResult = ReceiptsData & {
  reload: () => void;
  refreshing: boolean;
  query: ReceiptsQueryState;
  setQuery: React.Dispatch<React.SetStateAction<ReceiptsQueryState>>;
  setPage: (page: number) => void;
  openDetail: (receiptId: string) => Promise<void>;
  closeDetail: () => void;
};

const emptyPage = (): PortalReceiptsResponse => ({
  timezone: "Europe/Berlin",
  period: "today",
  summary: {
    receiptsCount: 0,
    activeCount: 0,
    printedCount: 0,
    reprintedCount: 0,
    refundsCount: 0,
    posRevenueCents: 0,
    paymentSummary: {
      cashCents: 0,
      cardCents: 0,
      voucherCents: 0,
      otherCents: 0,
      currency: "EUR",
    },
  },
  receipts: [],
  pagination: {
    total: 0,
    limit: PORTAL_RECEIPTS_PAGE_SIZE,
    offset: 0,
    page: 1,
    totalPages: 0,
  },
});

export function usePortalReceiptsData(
  customer: PortalCustomer,
): UsePortalReceiptsDataResult {
  const [query, setQuery] = React.useState<ReceiptsQueryState>({
    period: DEFAULT_RECEIPTS_PERIOD,
    paymentMethod: "all",
    status: "all",
    search: "",
    sort: DEFAULT_RECEIPTS_SORT,
    page: 1,
  });
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [state, setState] = React.useState<ReceiptsData>(() => ({
    customer,
    page: null,
    detail: null,
    detailReceiptId: null,
    detailLoading: false,
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

  const setPage = React.useCallback((page: number) => {
    setQuery((prev) => ({ ...prev, page: Math.max(page, 1) }));
  }, []);

  React.useEffect(() => {
    hasLoadedRef.current = false;
  }, [customer.id]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(query.search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query.search]);

  React.useEffect(() => {
    setQuery((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, [debouncedSearch]);

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
        const page = await fetchPortalReceipts({
          period: mapReceiptsPeriodToApi(query.period),
          paymentMethod:
            query.paymentMethod === "all" ? undefined : query.paymentMethod,
          status: query.status === "all" ? undefined : query.status,
          search: debouncedSearch || undefined,
          sort: query.sort,
          limit: PORTAL_RECEIPTS_PAGE_SIZE,
          page: query.page,
        });
        if (cancelled) return;

        hasLoadedRef.current = true;
        if (
          page.pagination.totalPages > 0 &&
          query.page > page.pagination.totalPages
        ) {
          setQuery((prev) => ({
            ...prev,
            page: page.pagination.totalPages,
          }));
        }

        setState((prev) => ({
          ...prev,
          customer,
          page,
          loading: false,
          error: false,
          lastSyncedAt: new Date(),
        }));
      } catch {
        if (!cancelled) {
          hasLoadedRef.current = true;
          setState((prev) => ({
            ...prev,
            customer,
            page: isBackgroundRefresh ? prev.page : emptyPage(),
            loading: false,
            error: true,
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
  }, [customer, tick, query.period, query.paymentMethod, query.status, query.sort, query.page, debouncedSearch]);

  const openDetail = React.useCallback(async (receiptId: string) => {
    setState((prev) => ({
      ...prev,
      detailReceiptId: receiptId,
      detailLoading: true,
      detail: null,
    }));

    try {
      const detail: PortalReceiptDetailResponse =
        await fetchPortalReceiptDetail(receiptId);
      setState((prev) => ({
        ...prev,
        detail,
        detailLoading: false,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        detail: null,
        detailLoading: false,
      }));
    }
  }, []);

  const closeDetail = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      detailReceiptId: null,
      detail: null,
      detailLoading: false,
    }));
  }, []);

  return {
    ...state,
    reload,
    refreshing,
    query,
    setQuery,
    setPage,
    openDetail,
    closeDetail,
  };
}
