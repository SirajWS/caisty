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
import { ReceiptsTable } from "../components/orders/ReceiptsTable";
import { PaymentOverview } from "../components/orders/PaymentOverview";
import { OrdersEmptyState } from "../components/orders/OrdersEmptyState";
import { OrdersFilters } from "../components/orders/OrdersFilters";
import { ReceiptDetailDrawer } from "../components/orders/ReceiptDetailDrawer";
import { PortalExportPdfButton } from "../components/portal/PortalExportPdfButton";
import {
  buildOrdersDocumentLabels,
  buildReceiptDocumentLabels,
} from "../lib/documents/documentLabels";
import type { DocumentIdentity } from "../lib/documents/types";
import { buildDocumentMeta, resolveDocumentIdentity } from "../lib/documents/documentMeta";
import type { PosReceiptRow } from "../lib/orders/types";
import { portalPageShell, portalPageSubtitle, portalPageTitle, portalSecondaryCta } from "../lib/portalUi";

const PortalOrdersPage: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const o = t.orders;
  const isLight = theme === "light";

  const release = React.useMemo(() => getPosReleaseConfig(), []);
  const data = usePortalOrdersData(customer);
  const [ordersExpanded, setOrdersExpanded] = React.useState(false);
  const [receiptsExpanded, setReceiptsExpanded] = React.useState(false);

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

  const showEmptyHero = !data.loading && !orders.hasSalesData;
  const [exportingPdf, setExportingPdf] = React.useState(false);
  const [selectedReceipt, setSelectedReceipt] =
    React.useState<PosReceiptRow | null>(null);
  const [downloadingReceiptId, setDownloadingReceiptId] = React.useState<
    string | null
  >(null);
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

  React.useEffect(() => {
    if (exportingPdf) return;

    const intervalId = window.setInterval(() => {
      data.reload();
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [data.reload, exportingPdf]);

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

  const handleViewReceipt = React.useCallback((receipt: PosReceiptRow) => {
    setSelectedReceipt(receipt);
  }, []);

  const handleDownloadReceiptPdf = React.useCallback(
    async (receipt: PosReceiptRow) => {
      const sales = data.sales;
      if (!sales) return;

      setDownloadingReceiptId(receipt.id);
      try {
        const identity =
          receiptIdentity ?? (await resolveDocumentIdentity(customer));
        const { exportReceiptPdf } = await import(
          "../lib/documents/receiptDocument"
        );
        const receiptLabel =
          receipt.source.receiptNumber?.trim() ||
          receipt.source.localReceiptId;

        exportReceiptPdf({
          meta: buildDocumentMeta({
            identity,
            period: { label: receiptLabel },
            generatedAt: new Date(),
            timezone: sales.timezone,
            currency: receipt.source.currency,
            locale,
          }),
          labels: buildReceiptDocumentLabels(t),
          receipt: receipt.source,
        });
      } finally {
        setDownloadingReceiptId(null);
      }
    },
    [customer, data.sales, locale, receiptIdentity, t],
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

  const receiptsExpandLabels = React.useMemo(
    () => ({
      viewAll: o.viewAllReceipts.replace(
        "{{count}}",
        String(orders.receipts.length),
      ),
      showLess: o.showLess,
    }),
    [o.viewAllReceipts, o.showLess, orders.receipts.length],
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
        columns={{
          time: o.colTime,
          orderNumber: o.colOrderNumber,
          status: o.colStatus,
          payment: o.colPayment,
          amount: o.colAmount,
          cashier: o.colCashier,
          device: o.colDevice,
        }}
      />

      <ReceiptsTable
        receipts={orders.receipts}
        loading={data.loading}
        title={o.receiptsTitle}
        emptyLabel={o.receiptsEmpty}
        actionsLabel={o.colActions}
        actionView={o.actionView}
        actionPrint={o.actionPrint}
        actionDownload={o.actionDownloadPdf}
        previewLimit={ORDERS_PREVIEW_LIMIT}
        totalCount={orders.receipts.length}
        expanded={receiptsExpanded}
        onToggleExpand={() => setReceiptsExpanded((value) => !value)}
        expandLabels={receiptsExpandLabels}
        onView={handleViewReceipt}
        onDownloadPdf={handleDownloadReceiptPdf}
        downloadingReceiptId={downloadingReceiptId}
        columns={{
          receipt: o.colReceipt,
          time: o.colTime,
          customer: o.colCustomer,
          payment: o.colPayment,
          fiscal: o.colFiscal,
          amount: o.colAmount,
        }}
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
