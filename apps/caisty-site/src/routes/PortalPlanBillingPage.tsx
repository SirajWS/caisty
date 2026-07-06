import React from "react";
import { createStripeBillingPortalSession } from "../lib/portalApi";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { useCurrency } from "../lib/useCurrency";
import { usePortalBillingData } from "../lib/billing/usePortalBillingData";
import { deriveBillingState, pickBillingPrimaryLicense } from "../lib/billing/deriveBillingState";
import { BillingOverview } from "../components/billing/BillingOverview";
import { CurrentSubscription } from "../components/billing/CurrentSubscription";
import { BillingPlansPanel } from "../components/billing/BillingPlansPanel";
import { PaymentSection } from "../components/billing/PaymentSection";
import { InvoicesSection } from "../components/billing/InvoicesSection";
import { BillingHistorySection } from "../components/billing/BillingHistorySection";
import { VatTaxSection } from "../components/billing/VatTaxSection";
import { BillingDownloads } from "../components/billing/BillingDownloads";
import { BillingQuickActions } from "../components/billing/BillingQuickActions";
import { portalPageShell, portalPageSubtitle, portalPageTitle } from "../lib/portalUi";

const PortalPlanBillingPage: React.FC = () => {
  const { customer, setCustomer } = usePortalOutlet();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const c = t.billing.center;
  const locale = portalLocaleTag(language);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { currency } = useCurrency();

  const [error, setError] = React.useState<string | null>(null);
  const [busyBillingPortal, setBusyBillingPortal] = React.useState(false);

  const data = usePortalBillingData(customer, setCustomer);
  const primaryLicense = React.useMemo(
    () => pickBillingPrimaryLicense(data.licenses),
    [data.licenses],
  );

  const billing = React.useMemo(
    () =>
      deriveBillingState({
        customer: data.customer,
        primaryLicense,
        licensesLoading: data.licensesLoading,
        business: data.business,
        businessLoading: data.businessLoading,
        currency,
        locale,
        t,
      }),
    [
      data.customer,
      primaryLicense,
      data.licensesLoading,
      data.business,
      data.businessLoading,
      currency,
      locale,
      t,
    ],
  );

  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#invoices" || hash === "#billing-invoices") {
      document.getElementById("billing-invoices")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  async function handleManageSubscription() {
    try {
      setError(null);
      setBusyBillingPortal(true);
      const portalBase = import.meta.env.DEV
        ? "http://localhost:5173"
        : import.meta.env.VITE_PORTAL_BASE_URL || window.location.origin;
      const returnUrl = `${String(portalBase).replace(/\/+$/, "")}/portal/billing`;
      const url = await createStripeBillingPortalSession(returnUrl);
      window.location.href = url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.plan.billingPortalError);
    } finally {
      setBusyBillingPortal(false);
    }
  }

  const licensesErrorMessage =
    data.licensesError && !data.licensesLoading
      ? data.licensesError === "load_failed"
        ? t.plan.loadError
        : data.licensesError
      : null;

  const invoicesErrorMessage =
    data.invoicesError && !data.invoicesLoading
      ? data.invoicesError === "load_failed"
        ? t.invoices.errorLoad
        : data.invoicesError
      : null;

  return (
    <div className={`${portalPageShell()} dashboard-home billing-center`}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{c.pageTitle}</h1>
        <p className={portalPageSubtitle(isLight)}>{c.pageSubtitle}</p>
      </header>

      {(error || licensesErrorMessage) && (
        <div
          className={`rounded-xl border px-3 py-2 text-xs ${isLight ? "border-red-300 bg-red-50 text-red-800" : "border-red-700 bg-red-900/40 text-red-100"}`}
        >
          {error ?? licensesErrorMessage}
        </div>
      )}

      <BillingOverview kpis={billing.overview} loading={data.licensesLoading} isLight={isLight} />

      <div className="live-dashboard-split">
        <CurrentSubscription
          customer={data.customer}
          primaryLicense={primaryLicense}
          loading={data.licensesLoading}
          isLight={isLight}
          t={t}
          locale={locale}
          paidPeriod={data.customer.paidBillingPeriod}
          stripeEligible={!!data.customer.stripeBillingPortalEligible}
          busyBillingPortal={busyBillingPortal}
          onManageSubscription={handleManageSubscription}
        />
        <PaymentSection fields={billing.paymentPlaceholders} title={c.sectionPayment} />
      </div>

      <BillingPlansPanel
        licenses={data.licenses}
        setLicenses={data.setLicenses}
        loading={data.licensesLoading}
        isLight={isLight}
        t={t}
        currency={currency}
        paidPeriod={data.customer.paidBillingPeriod}
        onError={setError}
      />

      <InvoicesSection
        items={data.invoices}
        loading={data.invoicesLoading}
        error={invoicesErrorMessage}
        isLight={isLight}
        locale={locale}
        t={t}
        title={c.sectionInvoices}
      />

      <div className="live-dashboard-split">
        <BillingHistorySection title={c.sectionHistory} emptyMessage={c.historyEmpty} />
        <VatTaxSection
          fields={billing.vatFields}
          title={c.sectionVatTax}
          loading={data.businessLoading}
        />
      </div>

      <div className="live-dashboard-split">
        <BillingDownloads actions={billing.downloadActions} title={c.sectionDownloads} />
        <BillingQuickActions
          actions={billing.quickActions}
          title={c.sectionQuickActions}
          isLight={isLight}
          onManageSubscription={handleManageSubscription}
          busyBillingPortal={busyBillingPortal}
        />
      </div>
    </div>
  );
};

export default PortalPlanBillingPage;
