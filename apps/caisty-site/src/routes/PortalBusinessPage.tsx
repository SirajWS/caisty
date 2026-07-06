import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { getPortalEnvironmentLabel } from "../config/posConfig";
import { usePortalBusinessData } from "../lib/business/usePortalBusinessData";
import { deriveBusinessState } from "../lib/business/deriveBusinessState";
import { BusinessOverview } from "../components/business/BusinessOverview";
import { BusinessEditForm } from "../components/business/BusinessEditForm";
import { FiscalConfiguration } from "../components/business/FiscalConfiguration";
import { BusinessContact } from "../components/business/BusinessContact";
import { StoreInformation } from "../components/business/StoreInformation";
import { CloudStatus } from "../components/business/CloudStatus";
import { CompletionChecklist } from "../components/business/CompletionChecklist";
import { BusinessQuickActions } from "../components/business/BusinessQuickActions";
import { FutureModules } from "../components/business/FutureModules";
import { portalPageShell, portalPageSubtitle, portalPageTitle } from "../lib/portalUi";
import type { BusinessQuickAction } from "../lib/business/types";

const BUSINESS_EDIT_FORM_ID = "business-edit-form";

const PortalBusinessPage: React.FC = () => {
  const { customer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const b = t.business;
  const c = b.center;
  const isLight = theme === "light";
  const locale = portalLocaleTag(language);

  const environmentLabel = React.useMemo(() => getPortalEnvironmentLabel(), []);
  const data = usePortalBusinessData(customer);

  const business = React.useMemo(
    () =>
      deriveBusinessState({
        data,
        environmentLabel,
        locale,
        t,
      }),
    [data, environmentLabel, locale, t],
  );

  function scrollToEditForm() {
    document.getElementById(BUSINESS_EDIT_FORM_ID)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleQuickAction(action: BusinessQuickAction) {
    if (action.action === "scroll_to_edit") {
      scrollToEditForm();
    }
  }

  return (
    <div className={`${portalPageShell()} dashboard-home business-center`}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{c.pageTitle}</h1>
        <p className={portalPageSubtitle(isLight)}>{c.pageSubtitle}</p>
      </header>

      <BusinessOverview kpis={business.overview} loading={data.loading} isLight={isLight} />

      <BusinessEditForm
        formId={BUSINESS_EDIT_FORM_ID}
        profile={data.business}
        loading={data.loading}
        isLight={isLight}
        t={t}
        onSaved={data.reload}
      />

      <div className="live-dashboard-split">
        <BusinessContact
          fields={business.contact}
          title={c.sectionContact}
          comingSoonNote={c.contactComingSoon}
        />
        <FiscalConfiguration fields={business.fiscal} title={c.sectionFiscal} />
      </div>

      <div className="live-dashboard-split">
        <StoreInformation fields={business.store} title={c.sectionStore} />
        <CloudStatus
          cloud={business.cloud}
          title={c.sectionCloud}
          labels={{
            cloudConnected: c.cloudConnectedLabel,
            lastSync: c.lastSyncLabel,
            posConnected: c.posConnectedLabel,
            apiStatus: c.apiStatusLabel,
          }}
        />
      </div>

      <CompletionChecklist
        items={business.checklist}
        title={c.sectionChecklist}
        completionLabel={c.completionLabel}
        completionPercent={business.completionPercent}
      />

      <BusinessQuickActions
        actions={business.quickActions}
        title={c.sectionActions}
        onAction={handleQuickAction}
      />

      <FutureModules
        modules={business.futureModules}
        title={c.sectionFuture}
        comingSoonLabel={c.comingSoon}
      />
    </div>
  );
};

export default PortalBusinessPage;
