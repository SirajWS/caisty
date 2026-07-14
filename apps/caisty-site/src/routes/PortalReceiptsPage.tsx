import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { getPosReleaseConfig } from "../config/posConfig";
import { portalLocaleTag } from "../lib/portalLocale";
import { deriveReceiptsState } from "../lib/receipts/deriveReceiptsState";
import { usePortalReceiptsData } from "../lib/receipts/usePortalReceiptsData";
import { ReceiptsSummary } from "../components/receipts/ReceiptsSummary";
import { ReceiptsFilters } from "../components/receipts/ReceiptsFilters";
import { ReceiptsTable } from "../components/receipts/ReceiptsTable";
import { ReceiptsEmptyState } from "../components/receipts/ReceiptsEmptyState";
import { ReceiptPortalDetailDrawer } from "../components/receipts/ReceiptPortalDetailDrawer";
import { PaymentOverview } from "../components/orders/PaymentOverview";
import { resolveDocumentIdentity } from "../lib/documents/documentMeta";
import type { DocumentIdentity } from "../lib/documents/types";
import type { ReceiptTableRow } from "../lib/receipts/types";
import { portalPageShell, portalPageSubtitle, portalPageTitle, portalSecondaryCta } from "../lib/portalUi";

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

  const receipts = React.useMemo(
    () => deriveReceiptsState({ data, t, locale }),
    [data, t, locale],
  );

  const showEmptyHero = !data.loading && !receipts.hasReceipts;
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

  const handleRefresh = React.useCallback(() => {
    if (data.refreshing) return;
    data.reload();
  }, [data]);

  const handleViewReceipt = React.useCallback(
    (row: ReceiptTableRow) => {
      void data.openDetail(row.id);
    },
    [data],
  );

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
      colEventTime: r.colEventTime,
      colEvent: r.colEvent,
      colActor: r.colActor,
      close: r.detailClose,
      dash: t.labels.dash,
      statusActive: r.statusActive,
      statusRefunded: r.statusRefunded,
      statusPartialRefund: r.statusPartialRefund,
      statusVoided: r.statusVoided,
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
          <button
            type="button"
            className={`portal-refresh-btn ${portalSecondaryCta(isLight)}`}
            disabled={data.loading || data.refreshing}
            onClick={handleRefresh}
          >
            {data.refreshing ? r.refreshLoading : r.actionRefresh}
          </button>
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
          data.setQuery((prev) => ({ ...prev, period }))
        }
        onPaymentMethodChange={(paymentMethod) =>
          data.setQuery((prev) => ({ ...prev, paymentMethod }))
        }
        onStatusChange={(status) =>
          data.setQuery((prev) => ({ ...prev, status }))
        }
        onSearchChange={(search) =>
          data.setQuery((prev) => ({ ...prev, search }))
        }
        onSortChange={(sort) => data.setQuery((prev) => ({ ...prev, sort }))}
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
        onView={handleViewReceipt}
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

      <ReceiptPortalDetailDrawer
        open={data.detailReceiptId !== null}
        detail={data.detail}
        detailLoading={data.detailLoading}
        events={receipts.events}
        printStats={receipts.printStats}
        identity={identity}
        labels={drawerLabels}
        locale={locale}
        timezone={data.page?.timezone ?? "Europe/Berlin"}
        isLight={isLight}
        onClose={data.closeDetail}
      />
    </div>
  );
};

export default PortalReceiptsPage;
