import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { getPortalEnvironmentLabel } from "../config/posConfig";
import { usePortalBusinessData } from "../lib/business/usePortalBusinessData";
import { deriveBusinessState } from "../lib/business/deriveBusinessState";
import { BusinessSetupProgress } from "../components/business/BusinessSetupProgress";
import { BusinessEditForm } from "../components/business/BusinessEditForm";
import { FiscalSummary } from "../components/business/FiscalSummary";
import { BusinessFooter } from "../components/business/BusinessFooter";
import { portalPageShell, portalPageSubtitle, portalPageTitle } from "../lib/portalUi";

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

  const footerLinks = React.useMemo(
    () => [
      { id: "licenses", label: c.footerLicenses, href: "/portal/licenses" },
      { id: "devices", label: c.footerDevices, href: "/portal/devices" },
      { id: "support", label: c.footerSupport, href: "/portal/support" },
    ],
    [c.footerDevices, c.footerLicenses, c.footerSupport],
  );

  return (
    <div className={`${portalPageShell()} dashboard-home business-center`}>
      <header className="business-page-header">
        <h1 className={portalPageTitle(isLight)}>{c.pageTitle}</h1>
        <p className={portalPageSubtitle(isLight)}>{c.pageSubtitle}</p>
      </header>

      <BusinessSetupProgress
        setup={business.setup}
        title={c.setupTitle}
        missingLabel={c.setupMissing}
        completeMessage={c.setupComplete}
      />

      <BusinessEditForm
        formId={BUSINESS_EDIT_FORM_ID}
        profile={data.business}
        loading={data.loading}
        isLight={isLight}
        t={t}
        onSaved={data.reload}
      />

      <FiscalSummary fields={business.fiscalSummary} title={c.sectionFiscalSummary} />

      <BusinessFooter links={footerLinks} isLight={isLight} />
    </div>
  );
};

export default PortalBusinessPage;
