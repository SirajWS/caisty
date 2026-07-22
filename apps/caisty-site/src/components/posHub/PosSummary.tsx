import { Link } from "react-router-dom";
import type { PortalTranslations } from "../../lib/translations/portal";
import type { PosReleaseConfig } from "../../config/posConfig";
import type { PosHubSummaryView, PosHubTone } from "../../lib/posHub/types";
import { portalPrimaryCta, portalTextLink } from "../../lib/portalUi";
import { useOpenDesktopPos } from "./useOpenDesktopPos";

function statusToneClass(tone: PosHubTone): string {
  if (tone === "ok") return "pos-summary-value--ok";
  if (tone === "attention") return "pos-summary-value--attention";
  if (tone === "action_required") return "pos-summary-value--action";
  return "";
}

export function PosSummary({
  summary,
  loading,
  isLight,
  p,
  release,
  dash,
}: {
  summary: PosHubSummaryView;
  loading: boolean;
  isLight: boolean;
  p: PortalTranslations["pos"];
  release: PosReleaseConfig;
  dash: string;
}) {
  const { openDesktop } = useOpenDesktopPos(release);

  return (
    <section className="dashboard-panel dashboard-panel--wide pos-summary">
      <div className="pos-summary-bar">
        <div className="pos-summary-left">
          <h1 className={`pos-summary-title ${isLight ? "text-slate-900" : "text-slate-50"}`}>
            {p.title}
          </h1>
          <p className={`pos-summary-subtitle ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            {p.pageSubtitle}
          </p>
        </div>

        <div className="pos-summary-mid">
          <div className="pos-summary-item">
            <span className="pos-summary-label">{p.summaryPosStatus}</span>
            <span
              className={`pos-summary-value ${loading ? "" : statusToneClass(summary.posStatusTone)}`}
            >
              {loading ? dash : summary.posStatusLabel}
            </span>
          </div>
          <div className="pos-summary-item">
            <span className="pos-summary-label">{p.summaryLicensePlan}</span>
            <span className="pos-summary-value">{loading ? dash : summary.licensePlanLabel}</span>
          </div>
          <div className="pos-summary-item">
            <span className="pos-summary-label">{p.kpiConnectedDevices}</span>
            <Link to="/portal/devices" className={`pos-summary-value pos-summary-link ${portalTextLink(isLight)}`}>
              {loading ? dash : summary.devicesShortLabel}
            </Link>
          </div>
          <div className="pos-summary-item">
            <span className="pos-summary-label">{p.summaryWebApp}</span>
            <span
              className={`pos-summary-value ${loading ? "" : release.web.enabled ? statusToneClass("ok") : ""}`}
            >
              {loading ? dash : release.web.enabled ? p.statusAvailable : p.statusComingSoon}
            </span>
          </div>
        </div>

        <div className="pos-summary-right">
          <button type="button" onClick={openDesktop} className={`pos-summary-cta ${portalPrimaryCta()}`}>
            {p.openDesktopPos}
          </button>
        </div>
      </div>
    </section>
  );
}
