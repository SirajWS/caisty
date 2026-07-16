import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { getPosReleaseConfig } from "../config/posConfig";
import { portalLocaleTag } from "../lib/portalLocale";
import { deriveReceiptsState } from "../lib/receipts/deriveReceiptsState";
import { usePortalReceiptsData } from "../lib/receipts/usePortalReceiptsData";
import { fetchAllPortalReceiptsForExport } from "../lib/receipts/fetchAllPortalReceiptsForExport";
import { mapReceiptsPeriodToApi } from "../lib/receipts/receiptsPeriod";
import { ReceiptsSummary } from "../components/receipts/ReceiptsSummary";
import { ReceiptsFilters } from "../components/receipts/ReceiptsFilters";
import { ReceiptsTable } from "../components/receipts/ReceiptsTable";
import { ReceiptsEmptyState } from "../components/receipts/ReceiptsEmptyState";
import { ReceiptPortalDetailDrawer } from "../components/receipts/ReceiptPortalDetailDrawer";
import { PortalPagination } from "../components/portal/PortalPagination";
import { PaymentOverview } from "../components/orders/PaymentOverview";
import { PortalExportPdfButton } from "../components/portal/PortalExportPdfButton";
import { resolveDocumentIdentity } from "../lib/documents/documentMeta";
import { buildDocumentMeta } from "../lib/documents/documentMeta";
import type { DocumentIdentity } from "../lib/documents/types";
import type { ReceiptTableRow } from "../lib/receipts/types";
import {
  portalPageShell,
  portalPageSubtitle,
  portalPageTitle,
  portalSecondaryCta,
} from "../lib/portalUi";
import { getReceiptsPeriodFilters } from "../lib/receipts/receiptsPeriod";

const PortalReceiptsPage: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const r = t.receipts;
  const isLight = theme === "light";

  const release = React.useMemo(() => getPosReleaseConfig(), []);
  const locale = portalLocaleTag(language);
  const data = usePortalReceiptsData(customer);
  const [exportingPdf, setExportingPdf] = React.useState(false);

  const receipts = React.useMemo(
    () => deriveReceiptsState({ data, t, locale }),
    [data, t, locale],
  );

  const showEmptyHero =
    !data.loading && !data.error && !receipts.hasReceipts;
  const [identity, setIdentity] = React.useState<DocumentIdentity | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void resolveDocumentIdentity(customer).then((value) => {
      if (!cancelled) setIdentity(value);
    });
    return () => {
      cancelled = true;
    };
  }, [customer]);

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      data.reload();
    }, 30_000);
    return () => window.clearInterval(intervalId);
  }, [data.reload]);

  const periodFilters = React.useMemo(
    () => getReceiptsPeriodFilters(t.reports),
    [t.reports],
  );
  const periodLabel =
    periodFilters.find((f) => f.id === data.query.period)?.label ??
    r.filtersTitle;

  const handleRefresh = React.useCallback(() => {
    if (data.refreshing || exportingPdf) return;
    data.reload();
  }, [data, exportingPdf]);

  const handleViewReceipt = React.useCallback(
    (row: ReceiptTableRow) => {
      void data.openDetail(row.id);
    },
    [data],
  );

  const handlePrintReceipt = React.useCallback(
    async (receiptId: string) => {
      try {
        const resolvedIdentity =
          identity ?? (await resolveDocumentIdentity(customer));
        const { fetchPortalReceiptDetail } = await import("../lib/portalApi");
        const { exportReceiptDetailPdf } = await import(
          "../lib/documents/receiptDocument"
        );
        const { buildReceiptDetailDocumentLabels } = await import(
          "../lib/documents/documentLabels"
        );
        const detail = await fetchPortalReceiptDetail(receiptId);
        exportReceiptDetailPdf({
          meta: buildDocumentMeta({
            identity: resolvedIdentity,
            period: { label: periodLabel },
            generatedAt: new Date(),
            timezone: data.page?.timezone ?? "Europe/Berlin",
            currency:
              detail.receipt.currency ||
              data.page?.summary.paymentSummary.currency ||
              "EUR",
            locale,
          }),
          labels: buildReceiptDetailDocumentLabels(t),
          detail,
        });
      } catch {
        // Silent fail — user can retry
      }
    },
    [customer, data.page, identity, locale, periodLabel, t],
  );

  const handlePrintRow = React.useCallback(
    (row: ReceiptTableRow) => {
      void handlePrintReceipt(row.id);
    },
    [handlePrintReceipt],
  );

  const handleExportPdf = React.useCallback(async () => {
    setExportingPdf(true);
    try {
      const resolvedIdentity =
        identity ?? (await resolveDocumentIdentity(customer));
      const page = await fetchAllPortalReceiptsForExport({
        period: mapReceiptsPeriodToApi(data.query.period),
        paymentMethod:
          data.query.paymentMethod === "all"
            ? undefined
            : data.query.paymentMethod,
        status: data.query.status === "all" ? undefined : data.query.status,
        search: data.query.search.trim() || undefined,
        sort: data.query.sort,
      });
      const { exportReceiptsListPdf } = await import(
        "../lib/documents/receiptsListDocument"
      );
      const { buildReceiptsListDocumentLabels } = await import(
        "../lib/documents/documentLabels"
      );
      exportReceiptsListPdf({
        meta: buildDocumentMeta({
          identity: resolvedIdentity,
          period: { label: periodLabel },
          generatedAt: new Date(),
          timezone: page.timezone,
          currency: page.summary.paymentSummary.currency || "EUR",
          locale,
        }),
        labels: buildReceiptsListDocumentLabels(t),
        page,
      });
    } finally {
      setExportingPdf(false);
    }
  }, [customer, data.query, identity, locale, periodLabel, t]);

  const drawerLabels = React.useMemo(
    () => ({
      title: r.detailTitle,
      business: t.pdfDocuments.business,
      store: t.pdfDocuments.store,
      receipt: r.colReceiptNumber,
      date: r.colDate,
      time: r.colTime,
      customer: r.colCashier,
      payment: r.colPayment,
      fiscal: r.colFiscal,
      amount: r.colAmount,
      device: r.colDevice,
      status: r.colStatus,
      fiscalPending: r.fiscalPending,
      itemsTitle: r.itemsTitle,
      itemsEmpty: r.itemsEmpty,
      colProduct: r.colProduct,
      colQuantity: r.colQuantity,
      colUnitPrice: r.colUnitPrice,
      colLineTotal: r.colLineTotal,
      totalsTitle: r.totalsTitle,
      netTotal: r.netTotal,
      taxTotal: r.taxTotal,
      grossTotal: r.grossTotal,
      printStatsTitle: r.printStatsTitle,
      originalPrint: r.originalPrint,
      reprintCount: r.reprintCountLabel,
      lastPrintTime: r.lastPrintTime,
      historyTitle: r.historyTitle,
      historyEmpty: r.historyEmpty,
      sectionOverview: r.sectionOverview,
      sectionPos: r.sectionPos,
      sectionPayment: r.sectionPayment,
      sectionFiscal: r.sectionFiscal,
      sectionActivity: r.sectionActivity,
      sectionProducts: r.sectionProducts,
      sectionTotals: r.sectionTotals,
      printReceipt: r.printReceipt,
      paymentPending: t.orders.paymentPending,
      paymentPaid: t.orders.paymentPaid,
      close: r.detailClose,
      dash: t.labels.dash,
      statusActive: r.statusActive,
      statusRefunded: r.statusRefunded,
      statusPartialRefund: r.statusPartialRefund,
      statusVoided: r.statusVoided,
      refundedAmount: r.refundedAmount,
      currentPaymentMethod: r.currentPaymentMethod,
    }),
    [r, t],
  );

  return (
    <div className={`${portalPageShell()} dashboard-home receipts-center`}>
      <header className="portal-page-header">
        <div className="portal-page-header-copy">
          <h1 className={portalPageTitle(isLight)}>{r.title}</h1>
          <p className={portalPageSubtitle(isLight)}>{r.subtitle}</p>
        </div>
        <div className="portal-page-header-actions">
          <p className="portal-auto-refresh-hint">{r.autoRefreshHint}</p>
          <div className="portal-page-header-buttons">
            <button
              type="button"
              className={`portal-refresh-btn ${portalSecondaryCta(isLight)}`}
              disabled={data.loading || data.refreshing || exportingPdf}
              onClick={handleRefresh}
            >
              {data.refreshing ? r.refreshLoading : r.actionRefresh}
            </button>
            <PortalExportPdfButton
              label={r.actionExportPdf}
              loadingLabel={t.pdfDocuments.exporting}
              disabled={data.loading || !receipts.hasReceipts}
              loading={exportingPdf}
              onClick={handleExportPdf}
              isLight={isLight}
            />
          </div>
        </div>
      </header>

      <ReceiptsSummary
        kpis={receipts.summary}
        loading={data.loading}
        isLight={isLight}
      />

      <PaymentOverview
        payments={receipts.payments}
        title={r.paymentSummaryTitle}
        hint={receipts.hasReceipts ? undefined : r.paymentEmptyHint}
      />

      <ReceiptsFilters
        r={r}
        reports={t.reports}
        period={data.query.period}
        paymentMethod={data.query.paymentMethod}
        status={data.query.status}
        search={data.query.search}
        sort={data.query.sort}
        onPeriodChange={(period) =>
          data.setQuery((prev) => ({ ...prev, period, page: 1 }))
        }
        onPaymentMethodChange={(paymentMethod) =>
          data.setQuery((prev) => ({ ...prev, paymentMethod, page: 1 }))
        }
        onStatusChange={(status) =>
          data.setQuery((prev) => ({ ...prev, status, page: 1 }))
        }
        onSearchChange={(search) => data.setQuery((prev) => ({ ...prev, search }))}
        onSortChange={(sort) =>
          data.setQuery((prev) => ({ ...prev, sort, page: 1 }))
        }
      />

      {showEmptyHero ? (
        <ReceiptsEmptyState
          headline={r.emptyHeadline}
          description={r.emptyDescription}
          ctaLabel={r.emptyCta}
          release={release}
        />
      ) : null}

      <ReceiptsTable
        receipts={receipts.receipts}
        loading={data.loading}
        isLight={isLight}
        title={r.tableTitle}
        emptyLabel={r.tableEmpty}
        actionsLabel={r.colActions}
        actionView={r.actionView}
        actionPrint={r.actionPrint}
        onView={handleViewReceipt}
        onPrint={handlePrintRow}
        columns={{
          receiptNumber: r.colReceiptNumber,
          date: r.colDate,
          time: r.colTime,
          cashier: r.colCashier,
          payment: r.colPayment,
          amount: r.colAmount,
          status: r.colStatus,
          fiscal: r.colFiscal,
          printCount: r.colPrintCount,
          lastEvent: r.colLastEvent,
        }}
      />

      {data.page?.pagination ? (
        <PortalPagination
          pagination={data.page.pagination}
          onPageChange={data.setPage}
          labels={{
            previous: r.paginationPrevious,
            next: r.paginationNext,
            pageOf: r.paginationPageOf,
            showing: r.paginationShowing,
          }}
        />
      ) : null}

      <ReceiptPortalDetailDrawer
        open={data.detailReceiptId !== null}
        detail={data.detail}
        detailLoading={data.detailLoading}
        events={receipts.events}
        printStats={receipts.printStats}
        refundSummary={receipts.refundSummary}
        identity={identity}
        labels={drawerLabels}
        locale={locale}
        timezone={data.page?.timezone ?? "Europe/Berlin"}
        isLight={isLight}
        onClose={data.closeDetail}
        onPrint={() => {
          if (data.detailReceiptId) {
            void handlePrintReceipt(data.detailReceiptId);
          }
        }}
      />
    </div>
  );
};

export default PortalReceiptsPage;
