import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { getPosReleaseConfig } from "../config/posConfig";
import { deriveOrdersState } from "../lib/orders/deriveOrdersState";
import { usePortalOrdersData } from "../lib/orders/usePortalOrdersData";
import {
  buildOrdersPagination,
  clampOrdersPage,
  ORDERS_PAGE_SIZE,
  sliceOrdersPage,
} from "../lib/orders/ordersPagination";
import { OrdersSummary } from "../components/orders/OrdersSummary";
import { PaymentSummaryPair } from "../components/orders/PaymentSummaryPair";
import { OrdersTable } from "../components/orders/OrdersTable";
import { OnlineOrdersTable } from "../components/orders/OnlineOrdersTable";
import { OrdersEmptyState } from "../components/orders/OrdersEmptyState";
import { OrdersErrorState } from "../components/orders/OrdersErrorState";
import { OrdersFilters } from "../components/orders/OrdersFilters";
import { ReceiptDetailDrawer } from "../components/orders/ReceiptDetailDrawer";
import { OrderDetailDrawer } from "../components/orders/OrderDetailDrawer";
import { formatPortalPaymentMethod } from "../lib/portal/portalSalesLabels";
import { PortalExportPdfButton } from "../components/portal/PortalExportPdfButton";
import {
  buildOrdersDocumentLabels,
} from "../lib/documents/documentLabels";
import type { DocumentIdentity } from "../lib/documents/types";
import { buildDocumentMeta, resolveDocumentIdentity } from "../lib/documents/documentMeta";
import type { PosOrderRow, PosReceiptRow, ProviderOrderRow } from "../lib/orders/types";
import { portalPageShell, portalPageSubtitle, portalPageTitle, portalSecondaryCta } from "../lib/portalUi";

const PortalOrdersPage: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const o = t.orders;
  const isLight = theme === "light";

  const release = React.useMemo(() => getPosReleaseConfig(), []);
  const [exportingPdf, setExportingPdf] = React.useState(false);
  const data = usePortalOrdersData(customer, { pollingPaused: exportingPdf });
  const [liveOrdersPage, setLiveOrdersPage] = React.useState(1);
  const [onlineOrdersPage, setOnlineOrdersPage] = React.useState(1);

  const locale = portalLocaleTag(language);

  const orders = React.useMemo(
    () => deriveOrdersState({ data, t, locale }),
    [data, t, locale],
  );

  const livePagination = React.useMemo(
    () => buildOrdersPagination(orders.orders.length, liveOrdersPage),
    [orders.orders.length, liveOrdersPage],
  );
  const onlinePagination = React.useMemo(
    () => buildOrdersPagination(orders.providerOrders.length, onlineOrdersPage),
    [orders.providerOrders.length, onlineOrdersPage],
  );

  const paginatedLiveOrders = React.useMemo(
    () => sliceOrdersPage(orders.orders, livePagination),
    [orders.orders, livePagination],
  );
  const paginatedOnlineOrders = React.useMemo(
    () => sliceOrdersPage(orders.providerOrders, onlinePagination),
    [orders.providerOrders, onlinePagination],
  );

  React.useEffect(() => {
    const nextPage = clampOrdersPage(
      liveOrdersPage,
      orders.orders.length,
      ORDERS_PAGE_SIZE,
    );
    if (nextPage !== liveOrdersPage) {
      setLiveOrdersPage(nextPage);
    }
  }, [orders.orders.length, liveOrdersPage]);

  React.useEffect(() => {
    const nextPage = clampOrdersPage(
      onlineOrdersPage,
      orders.providerOrders.length,
      ORDERS_PAGE_SIZE,
    );
    if (nextPage !== onlineOrdersPage) {
      setOnlineOrdersPage(nextPage);
    }
  }, [orders.providerOrders.length, onlineOrdersPage]);

  const showErrorHero = !data.loading && data.error && !data.sales;
  const showEmptyHero =
    !data.loading && !data.error && data.sales !== null && !orders.hasSalesData;
  const [selectedReceipt, setSelectedReceipt] =
    React.useState<PosReceiptRow | null>(null);
  const [drawerOrderId, setDrawerOrderId] = React.useState<string | null>(null);
  const [receiptIdentity, setReceiptIdentity] =
    React.useState<DocumentIdentity | null>(null);
  const viewTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const periodLabel = o.filterToday;

  const selectedOrder = React.useMemo(() => {
    if (!drawerOrderId) return null;
    const fromLive = orders.orders.find((row) => row.id === drawerOrderId);
    if (fromLive) return fromLive;
    const fromOnline = orders.providerOrders.find((row) => row.id === drawerOrderId);
    return (fromOnline as PosOrderRow | undefined) ?? null;
  }, [drawerOrderId, orders.orders, orders.providerOrders]);

  React.useEffect(() => {
    if (drawerOrderId && !selectedOrder && !data.loading) {
      setDrawerOrderId(null);
    }
  }, [drawerOrderId, selectedOrder, data.loading]);

  React.useEffect(() => {
    let cancelled = false;
    void resolveDocumentIdentity(customer).then((identity) => {
      if (!cancelled) setReceiptIdentity(identity);
    });
    return () => {
      cancelled = true;
    };
  }, [customer]);

  const handleRefresh = React.useCallback(() => {
    if (exportingPdf || data.refreshing) return;
    data.reload();
  }, [data, exportingPdf]);

  const handleExportPdf = React.useCallback(async () => {
    const sales = data.sales;
    if (!sales) return;

    setExportingPdf(true);
    try {
      const identity = await resolveDocumentIdentity(customer);
      const { exportOrdersPdf } = await import("../lib/documents/ordersDocument");
      exportOrdersPdf({
        meta: buildDocumentMeta({
          identity,
          period: { label: periodLabel },
          generatedAt: new Date(),
          timezone: sales.timezone,
          currency: sales.summary.paymentSummary.currency,
          locale,
        }),
        labels: buildOrdersDocumentLabels(t),
        sales,
      });
    } finally {
      setExportingPdf(false);
    }
  }, [customer, data.sales, locale, periodLabel, t]);

  const handleViewOrder = React.useCallback(
    (order: PosOrderRow | ProviderOrderRow, trigger?: HTMLButtonElement | null) => {
      viewTriggerRef.current = trigger ?? null;
      setDrawerOrderId(order.id);
    },
    [],
  );

  const handleCloseOrder = React.useCallback(() => {
    setDrawerOrderId(null);
    viewTriggerRef.current?.focus();
  }, []);

  const handleViewReceiptFromOrder = React.useCallback(
    (receiptId: string) => {
      const receipt = orders.receipts.find((row) => row.id === receiptId);
      if (receipt) {
        setDrawerOrderId(null);
        setSelectedReceipt(receipt);
      }
    },
    [orders.receipts],
  );

  const receiptDrawerLabels = React.useMemo(
    () => ({
      title: o.receiptDetailTitle,
      business: t.pdfDocuments.business,
      store: t.pdfDocuments.store,
      receipt: o.colReceipt,
      time: o.colTime,
      customer: o.colCustomer,
      payment: o.colPayment,
      fiscal: o.colFiscal,
      amount: o.colAmount,
      device: o.colDevice,
      fiscalPending: o.receiptFiscalPending,
      itemsTitle: o.receiptItemsTitle,
      itemsEmpty: o.receiptItemsEmpty,
      colProduct: o.colProduct,
      colQuantity: o.colQuantity,
      colUnitPrice: o.colUnitPrice,
      colLineTotal: o.colLineTotal,
      close: o.receiptDetailClose,
      dash: t.labels.dash,
    }),
    [o, t],
  );

  const livePaginationLabels = React.useMemo(
    () => ({
      previous: o.paginationPrevious,
      next: o.paginationNext,
      pageOf: o.paginationPageOf,
      showing: o.paginationShowingLive,
    }),
    [o],
  );

  const onlinePaginationLabels = React.useMemo(
    () => ({
      previous: o.paginationPrevious,
      next: o.paginationNext,
      pageOf: o.paginationPageOf,
      showing: o.paginationShowingOnline,
    }),
    [o],
  );

  return (
    <div className={`${portalPageShell()} dashboard-home orders-ops`}>
      <header className="portal-page-header">
        <div className="portal-page-header-copy">
          <h1 className={portalPageTitle(isLight)}>{o.title}</h1>
          <p className={portalPageSubtitle(isLight)}>{o.subtitle}</p>
        </div>
        <div className="portal-page-header-actions">
          <p className="portal-auto-refresh-hint">{o.autoRefreshHint}</p>
          <div className="portal-page-header-buttons">
            <button
              type="button"
              className={`portal-refresh-btn ${portalSecondaryCta(isLight)}`}
              disabled={data.loading || data.refreshing || exportingPdf}
              onClick={handleRefresh}
            >
              {data.refreshing ? o.refreshLoading : o.actionRefresh}
            </button>
            <PortalExportPdfButton
              label={o.actionExportPdf}
              loadingLabel={t.pdfDocuments.exporting}
              disabled={data.loading || !orders.hasSalesData}
              loading={exportingPdf}
              onClick={handleExportPdf}
              isLight={isLight}
            />
          </div>
        </div>
      </header>

      <OrdersSummary
        orderKpis={orders.orderKpis}
        revenueKpis={orders.revenueKpis}
        loading={data.loading}
        isLight={isLight}
      />

      {!showErrorHero ? (
        <PaymentSummaryPair
          pos={{
            payments: orders.posPaymentCards,
            title: o.paymentSummaryTitle,
            hint: orders.hasSalesData ? undefined : o.paymentEmptyHint,
          }}
          online={{
            payments: orders.onlinePaymentCards,
            title: o.onlinePaymentSummaryTitle,
            hint: orders.hasSalesData ? undefined : o.paymentEmptyHint,
            infoHint: orders.hasSalesData ? o.onlinePaymentSummaryInfo : undefined,
            revenueHeader: orders.onlineRevenueHeader,
          }}
        />
      ) : null}

      <OrdersFilters label={o.filtersTitle} todayLabel={o.filterToday} />

      {showErrorHero ? (
        <OrdersErrorState
          headline={o.errorHeadline}
          description={o.errorDescription}
          retryLabel={o.errorRetry}
          onRetry={handleRefresh}
          isLight={isLight}
          loading={data.refreshing}
        />
      ) : null}

      {showEmptyHero ? (
        <OrdersEmptyState
          headline={o.emptyHeadline}
          description={o.emptyDescription}
          ctaLabel={o.emptyCta}
          release={release}
        />
      ) : null}

      <OrdersTable
        orders={paginatedLiveOrders}
        loading={data.loading}
        title={o.ordersFeedTitle}
        emptyLabel={o.ordersEmpty}
        primary
        pagination={livePagination}
        onPageChange={setLiveOrdersPage}
        paginationLabels={livePaginationLabels}
        onViewOrder={handleViewOrder}
        actionView={o.actionView}
        columns={{
          time: o.colTime,
          orderNumber: o.colOrderNumber,
          status: o.colStatus,
          payment: o.colPayment,
          receipt: o.colReceiptLink,
          amount: o.colAmount,
          cashier: o.colCashier,
          device: o.colDevice,
          actions: o.colActions,
        }}
      />

      <OnlineOrdersTable
        orders={paginatedOnlineOrders}
        loading={data.loading}
        title={o.onlineOrdersTitle}
        emptyLabel={o.onlineOrdersEmpty}
        emptyDescription={o.onlineOrdersEmptyHint}
        actionView={o.actionView}
        pagination={onlinePagination}
        onPageChange={setOnlineOrdersPage}
        paginationLabels={onlinePaginationLabels}
        onViewOrder={handleViewOrder}
        receiptsLinkLabel={o.viewAllReceiptsLink}
        receiptsHref="/portal/receipts"
        columns={{
          time: o.colTime,
          orderNumber: o.colOrderNumber,
          provider: o.colProvider,
          customer: o.colCustomer,
          details: o.colDetails,
          status: o.colStatus,
          payment: o.colPayment,
          amount: o.colAmount,
          actions: o.colActions,
        }}
      />
      <OrderDetailDrawer
        open={drawerOrderId !== null && selectedOrder !== null}
        order={selectedOrder}
        detailRefreshKey={data.lastSyncedAt?.getTime() ?? null}
        labels={{
          title: o.orderDetailTitle,
          orderNumber: o.colOrderNumber,
          receiptNumber: o.colReceipt,
          cashier: o.colCashier,
          businessDate: o.colBusinessDate,
          status: o.colStatus,
          products: o.colProduct,
          discounts: o.colDiscounts,
          tax: o.colTax,
          net: o.colNet,
          gross: o.colGross,
          payments: o.colPayment,
          receipt: o.colReceipt,
          timeline: o.orderTimelineTitle,
          timelineEmpty: o.orderTimelineEmpty,
          receiptTimeline: o.receiptTimelineTitle,
          receiptTimelineEmpty: o.receiptTimelineEmpty,
          refundedAmount: o.refundedAmountLabel,
          paymentChanged: o.paymentChangedLabel,
          close: o.orderDetailClose,
          dash: t.labels.dash,
          colProduct: o.colProduct,
          colQuantity: o.colQuantity,
          colUnitPrice: o.colUnitPrice,
          colLineTotal: o.colLineTotal,
          colPayment: o.colPayment,
          colAmount: o.colAmount,
          viewReceipt: o.viewReceiptLink,
          provider: o.colProvider,
          providerOrderId: o.providerOrderIdLabel,
          customer: o.colCustomer,
          phone: o.colPhone,
          email: o.colEmail,
          deliveryAddress: o.deliveryAddressLabel,
          customerNote: o.customerNoteLabel,
          paymentStatus: o.colPayment,
          platform: o.colPlatform,
          orderSource: o.orderSourceLabel,
          onlineOrderBadge: o.onlineOrderBadge,
        }}
        locale={locale}
        timezone={data.sales?.timezone ?? "Europe/Berlin"}
        onClose={handleCloseOrder}
        onViewReceipt={handleViewReceiptFromOrder}
        formatPayment={(method) => formatPortalPaymentMethod(method, t)}
      />
      <ReceiptDetailDrawer
        open={selectedReceipt !== null}
        receipt={selectedReceipt}
        identity={receiptIdentity}
        labels={receiptDrawerLabels}
        locale={locale}
        timezone={data.sales?.timezone ?? "Europe/Berlin"}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};

export default PortalOrdersPage;
