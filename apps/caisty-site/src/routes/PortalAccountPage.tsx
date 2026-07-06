import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations, languages } from "../lib/translations";
import { usePortalAccountData } from "../lib/account/usePortalAccountData";
import {
  deriveAccountState,
  detectClientBrowser,
  emailVerificationLabel,
  securityStatusLabel,
} from "../lib/account/deriveAccountState";
import { AccountOverview } from "../components/account/AccountOverview";
import { AccountProfileForm } from "../components/account/AccountProfileForm";
import { PasswordSecurity } from "../components/account/PasswordSecurity";
import { AccountSessions } from "../components/account/AccountSessions";
import { AccountPreferences } from "../components/account/AccountPreferences";
import { LegalDocuments } from "../components/account/LegalDocuments";
import { AccountDataExport } from "../components/account/AccountDataExport";
import { SecurityChecklist } from "../components/account/SecurityChecklist";
import { portalPageShell, portalPageSubtitle, portalPageTitle } from "../lib/portalUi";
import type { PortalCustomer } from "../lib/portalApi";

const PortalAccountPage: React.FC = () => {
  const { customer: outletCustomer, setCustomer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const c = t.account.center;
  const isLight = theme === "light";

  const { customer, setCustomer: setLocalCustomer } = usePortalAccountData(outletCustomer);

  const browserLabel = React.useMemo(() => detectClientBrowser(), []);

  const languageLabel =
    languages.find((l) => l.code === language)?.nativeName ?? language.toUpperCase();

  const themeLabel = theme === "light" ? c.themeLight : c.themeDark;

  const account = React.useMemo(
    () =>
      deriveAccountState({
        customer,
        languageLabel,
        themeLabel,
        securityStatusLabel: securityStatusLabel(customer.portalStatus, t),
        emailStatusLabel: emailVerificationLabel(customer.portalStatus, t),
        roleLabel: c.roleOwner,
        browserLabel,
        t,
      }),
    [customer, languageLabel, themeLabel, browserLabel, t, c.roleOwner],
  );

  function handleProfileUpdated(updated: PortalCustomer) {
    setLocalCustomer(updated);
    setCustomer((prev) => {
      if (!prev) return updated;
      return { ...prev, ...updated, primaryLicense: prev.primaryLicense };
    });
  }

  return (
    <div className={`${portalPageShell()} dashboard-home account-center`}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{c.pageTitle}</h1>
        <p className={portalPageSubtitle(isLight)}>{c.pageSubtitle}</p>
      </header>

      <AccountOverview kpis={account.overview} isLight={isLight} />

      <div className="live-dashboard-split">
        <AccountProfileForm
          customer={customer}
          isLight={isLight}
          t={t}
          onUpdated={handleProfileUpdated}
        />
        <PasswordSecurity isLight={isLight} t={t} />
      </div>

      <div className="live-dashboard-split">
        <AccountSessions
          fields={account.session}
          title={c.sectionSessions}
          logoutLabel={c.sessionLogoutAll}
          comingSoonLabel={c.comingSoon}
        />
        <AccountPreferences languageLabel={languageLabel} themeLabel={themeLabel} t={t} />
      </div>

      <div className="live-dashboard-split">
        <LegalDocuments
          documents={account.legalDocuments}
          title={t.legal.title}
          subtitle={t.legal.subtitle}
          isLight={isLight}
        />
        <SecurityChecklist items={account.checklist} title={c.sectionChecklist} />
      </div>

      <AccountDataExport actions={account.dataActions} title={c.sectionData} />
    </div>
  );
};

export default PortalAccountPage;
