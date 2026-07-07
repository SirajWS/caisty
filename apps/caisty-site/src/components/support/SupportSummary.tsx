import type { PortalTranslations } from "../../lib/translations/portal";
import type { SupportSummaryView } from "../../lib/support/types";
import { portalPrimaryCta } from "../../lib/portalUi";

export function SupportSummary({
  summary,
  loading,
  isLight,
  t,
  supportEmail,
}: {
  summary: SupportSummaryView;
  loading: boolean;
  isLight: boolean;
  t: PortalTranslations;
  supportEmail: string;
}) {
  const c = t.support.center;

  return (
    <section className="dashboard-panel dashboard-panel--wide support-summary">
      <div className="support-summary-bar">
        <div className="support-summary-left">
          <h1 className={`support-summary-title ${isLight ? "text-slate-900" : "text-slate-50"}`}>
            {c.pageTitle}
          </h1>
          <p className={`support-summary-subtitle ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            {c.pageSubtitle}
          </p>
        </div>

        <div className="support-summary-mid">
          <span className="support-summary-mid-label">{c.summaryOpenRequests}</span>
          <span className="support-summary-mid-value">
            {loading ? t.labels.dash : String(summary.openCount)}
          </span>
        </div>

        <div className="support-summary-right">
          <a href={`mailto:${supportEmail}`} className={`support-summary-email ${portalPrimaryCta()}`}>
            {c.actionEmailSupport}
          </a>
        </div>
      </div>
    </section>
  );
}
