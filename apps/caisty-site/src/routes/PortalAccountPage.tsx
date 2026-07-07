import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { usePortalAccountData } from "../lib/account/usePortalAccountData";
import {
  deriveAccountState,
  emailVerificationLabel,
  securityStatusLabel,
} from "../lib/account/deriveAccountState";
import { AccountProfileForm } from "../components/account/AccountProfileForm";
import { PasswordSecurity } from "../components/account/PasswordSecurity";
import { SecurityStatus } from "../components/account/SecurityStatus";
import { AccountFooter } from "../components/account/AccountFooter";
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

  const account = React.useMemo(
    () =>
      deriveAccountState({
        customer,
        securityStatusLabel: securityStatusLabel(customer.portalStatus, t),
        emailStatusLabel: emailVerificationLabel(customer.portalStatus, t),
        t,
      }),
    [customer, t],
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
      <header className="account-page-header">
        <h1 className={portalPageTitle(isLight)}>{c.pageTitle}</h1>
        <p className={portalPageSubtitle(isLight)}>{c.pageSubtitle}</p>
      </header>

      <div className="account-layout">
        <div className="account-layout-col">
          <AccountProfileForm
            customer={customer}
            isLight={isLight}
            t={t}
            onUpdated={handleProfileUpdated}
          />
          <SecurityStatus items={account.securityStatus} title={c.sectionSecurityStatus} />
        </div>

        <div className="account-layout-col">
          <PasswordSecurity isLight={isLight} t={t} />
        </div>
      </div>

      <AccountFooter
        documents={account.legalDocuments}
        supportHref={account.supportHref}
        supportLabel={c.actionContactSupport}
        isLight={isLight}
      />
    </div>
  );
};

export default PortalAccountPage;
