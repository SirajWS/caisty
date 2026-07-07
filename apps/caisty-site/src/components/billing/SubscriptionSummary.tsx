import type { PortalLicense } from "../../lib/portalApi";
import type { PortalTranslations } from "../../lib/translations/portal";
import type { SubscriptionSummaryView } from "../../lib/billing/types";
import { portalLicenseStatusBadge, portalPrimaryCta, portalSecondaryCta } from "../../lib/portalUi";

export function SubscriptionSummary({
  summary,
  primaryLicense,
  loading,
  isLight,
  t,
  busyBillingPortal,
  showUpgradePlans,
  onManageSubscription,
  onManageBilling,
  onUpgrade,
}: {
  summary: SubscriptionSummaryView;
  primaryLicense: PortalLicense | null;
  loading: boolean;
  isLight: boolean;
  t: PortalTranslations;
  busyBillingPortal: boolean;
  showUpgradePlans: boolean;
  onManageSubscription: () => void;
  onManageBilling: () => void;
  onUpgrade: () => void;
}) {
  const c = t.billing.center;

  if (loading) {
    return (
      <section className="dashboard-panel dashboard-panel--wide billing-subscription-summary">
        <div className="billing-summary-skeleton" aria-busy="true">
          <div className={`billing-summary-skel-line billing-summary-skel-line--lg ${isLight ? "bg-slate-200" : "bg-slate-800"}`} />
          <div className={`billing-summary-skel-line ${isLight ? "bg-slate-200" : "bg-slate-800"}`} />
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-panel dashboard-panel--wide billing-subscription-summary">
      <div className="billing-summary-bar">
        <div className="billing-summary-left">
          <span className="billing-summary-plan">{summary.planLabel}</span>
          {primaryLicense ? (
            <span className={portalLicenseStatusBadge(primaryLicense.status, isLight)}>
              {summary.statusLabel}
            </span>
          ) : null}
          {summary.intervalLabel ? (
            <span className="billing-summary-interval">{summary.intervalLabel}</span>
          ) : null}
        </div>

        <dl className="billing-summary-mid">
          {summary.licenseKey ? (
            <div className="billing-summary-item">
              <dt>{c.summaryLicense}</dt>
              <dd className="font-mono text-xs">{summary.licenseKey}</dd>
            </div>
          ) : null}
          <div className="billing-summary-item">
            <dt>{c.summaryValidUntil}</dt>
            <dd>{summary.validUntilLabel}</dd>
          </div>
        </dl>

        <div className="billing-summary-right">
          {summary.showManageSubscription ? (
            <button
              type="button"
              onClick={onManageSubscription}
              disabled={busyBillingPortal}
              className={`billing-summary-cta ${portalSecondaryCta(isLight)}`}
            >
              {busyBillingPortal ? t.plan.manageSubscriptionBusy : t.plan.manageSubscription}
            </button>
          ) : null}
          {showUpgradePlans ? (
            <button
              type="button"
              onClick={onUpgrade}
              className={`billing-summary-cta ${portalPrimaryCta()}`}
            >
              {c.actionUpgradePlan}
            </button>
          ) : null}
        </div>
      </div>

      {summary.showPaymentEmpty ? (
        <div className="billing-payment-empty">
          <p className="billing-payment-empty-text">{c.paymentNoMethod}</p>
          <button
            type="button"
            className="billing-payment-empty-btn"
            onClick={onManageBilling}
          >
            {c.paymentManageBilling}
          </button>
        </div>
      ) : null}
    </section>
  );
}
