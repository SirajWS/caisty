import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { getPosReleaseConfig } from "../config/posConfig";
import { deriveOrdersState } from "../lib/orders/deriveOrdersState";
import { usePortalOrdersData } from "../lib/orders/usePortalOrdersData";
import { OrdersSummary } from "../components/orders/OrdersSummary";
import { OrdersTable } from "../components/orders/OrdersTable";
import { ReceiptsTable } from "../components/orders/ReceiptsTable";
import { PaymentOverview } from "../components/orders/PaymentOverview";
import { BusinessTimeline } from "../components/orders/BusinessTimeline";
import { OrdersEmptyState } from "../components/orders/OrdersEmptyState";
import { OrdersFilters, OrdersQuickActions } from "../components/orders/OrdersFilters";
import { portalPageShell, portalPageSubtitle, portalPageTitle } from "../lib/portalUi";

const PortalOrdersPage: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const o = t.orders;
  const locale = portalLocaleTag(language);
  const isLight = theme === "light";

  const release = React.useMemo(() => getPosReleaseConfig(), []);
  const data = usePortalOrdersData(customer);

  const orders = React.useMemo(
    () => deriveOrdersState({ data, t }),
    [data, t],
  );

  const showEmptyHero = !data.loading && !orders.hasPosSync;

  return (
    <div className={`${portalPageShell()} dashboard-home orders-ops`}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{o.title}</h1>
        <p className={portalPageSubtitle(isLight)}>{o.subtitle}</p>
      </header>

      <OrdersSummary kpis={orders.summary} loading={data.loading} isLight={isLight} />

      {showEmptyHero ? (
        <OrdersEmptyState
          headline={o.emptyHeadline}
          description={o.emptyDescription}
          ctaLabel={o.emptyCta}
          release={release}
        />
      ) : null}

      <OrdersFilters o={o} />

      <OrdersTable
        orders={orders.orders}
        loading={data.loading}
        title={o.ordersFeedTitle}
        emptyLabel={o.ordersEmpty}
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
        columns={{
          receipt: o.colReceipt,
          time: o.colTime,
          customer: o.colCustomer,
          payment: o.colPayment,
          fiscal: o.colFiscal,
          amount: o.colAmount,
        }}
      />

      <div className="live-dashboard-split">
        <PaymentOverview payments={orders.payments} title={o.paymentOverviewTitle} />
        <BusinessTimeline
          events={orders.events}
          locale={locale}
          title={o.eventsTitle}
          emptyLabel={o.eventsEmpty}
        />
      </div>

      <OrdersQuickActions actions={orders.quickActions} title={o.quickActionsTitle} />
    </div>
  );
};

export default PortalOrdersPage;
