import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { getPosReleaseConfig } from "../config/posConfig";
import { deriveOrdersState } from "../lib/orders/deriveOrdersState";
import { usePortalOrdersData } from "../lib/orders/usePortalOrdersData";
import { ORDERS_PREVIEW_LIMIT } from "../lib/orders/ordersPreview";
import { OrdersSummary } from "../components/orders/OrdersSummary";
import { OrdersTable } from "../components/orders/OrdersTable";
import { OnlineOrdersTable } from "../components/orders/OnlineOrdersTable";
import { PaymentOverview } from "../components/orders/PaymentOverview";
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
  const [ordersExpanded, setOrdersExpanded] = React.useState(false);
  const [providerOrdersExpanded, setProviderOrdersExpanded] = React.useState(false);

  const locale =
    language === "de"
      ? "de-DE"
      : language === "fr"
        ? "fr-FR"
        : language === "ar"
          ? "ar-EG"
          : "en-US";

  const orders = React.useMemo(
    () => deriveOrdersState({ data, t, locale }),
    [data, t, locale],
  );

  const showErrorHero = !data.loading && data.error && !data.sales;
  const showEmptyHero =
    !data.loading && !data.error && data.sales !== null && !orders.hasSalesData;
  const [selectedReceipt, setSelectedReceipt] =
    React.useState<PosReceiptRow | null>(null);
  const [selectedOrder, setSelectedOrder] = React.useState<PosOrderRow | null>(
    null,
  );
  const [receiptIdentity, setReceiptIdentity] =
    React.useState<DocumentIdentity | null>(null);
  const periodLabel = o.filterToday;

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

  const handleViewOrder = React.useCallback((order: PosOrderRow | ProviderOrderRow) => {
    setSelectedOrder(order as PosOrderRow);
  }, []);

  const handleViewReceiptFromOrder = React.useCallback(
    (receiptId: string) => {
      const receipt = orders.receipts.find((row) => row.id === receiptId);
      if (receipt) {
        setSelectedOrder(null);
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

  const ordersExpandLabels = React.useMemo(
    () => ({
      viewAll: o.viewAllOrders.replace("{{count}}", String(orders.orders.length)),
      showLess: o.showLess,
    }),
    [o.viewAllOrders, o.showLess, orders.orders.length],
  );

  const providerOrdersExpandLabels = React.useMemo(
    () => ({
      viewAll: o.viewAllOnlineOrders.replace(
        "{{count}}",
        String(orders.providerOrders.length),
      ),
      showLess: o.showLess,
    }),
    [o.viewAllOnlineOrders, o.showLess, orders.providerOrders.length],
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

      <OrdersSummary kpis={orders.summary} loading={data.loading} isLight={isLight} />

      <PaymentOverview
        payments={orders.payments}
        title={o.paymentSummaryTitle}
        hint={orders.hasSalesData ? undefined : o.paymentEmptyHint}
      />

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
        orders={orders.orders}
        loading={data.loading}
        title={o.ordersFeedTitle}
        emptyLabel={o.ordersEmpty}
        primary
        previewLimit={ORDERS_PREVIEW_LIMIT}
        totalCount={orders.orders.length}
        expanded={ordersExpanded}
        onToggleExpand={() => setOrdersExpanded((value) => !value)}
        expandLabels={ordersExpandLabels}
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
        orders={orders.providerOrders}
        loading={data.loading}
        title={o.onlineOrdersTitle}
        emptyLabel={o.onlineOrdersEmpty}
        emptyDescription={o.onlineOrdersEmptyHint}
        actionView={o.actionView}
        previewLimit={ORDERS_PREVIEW_LIMIT}
        totalCount={orders.providerOrders.length}
        expanded={providerOrdersExpanded}
        onToggleExpand={() => setProviderOrdersExpanded((value) => !value)}
        expandLabels={providerOrdersExpandLabels}
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
        open={selectedOrder !== null}
        order={selectedOrder}
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
          deliveryAddress: o.deliveryAddressLabel,
          customerNote: o.customerNoteLabel,
          paymentStatus: o.colPayment,
          platform: o.colPlatform,
          orderSource: o.orderSourceLabel,
          onlineOrderBadge: o.onlineOrderBadge,
        }}
        locale={locale}
        timezone={data.sales?.timezone ?? "Europe/Berlin"}
        onClose={() => setSelectedOrder(null)}
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
