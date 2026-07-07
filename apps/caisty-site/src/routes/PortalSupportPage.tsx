import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { usePortalSupportData } from "../lib/support/usePortalSupportData";
import { deriveSupportState } from "../lib/support/deriveSupportState";
import { SupportSummary } from "../components/support/SupportSummary";
import { SupportRequestForm } from "../components/support/SupportRequestForm";
import { SupportRequestsList } from "../components/support/SupportRequestsList";
import { SupportFooter } from "../components/support/SupportFooter";
import { portalPageShell } from "../lib/portalUi";

export default function PortalSupportPage() {
  const { customer } = usePortalOutlet();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getPortalTranslations(language);
  const c = t.support.center;
  const locale = portalLocaleTag(language);
  const isLight = theme === "light";

  const data = usePortalSupportData(customer);

  const support = React.useMemo(
    () =>
      deriveSupportState({
        customer: data.customer,
        messages: data.messages,
        messagesLoading: data.messagesLoading,
        messagesError: data.messagesError,
        licenses: data.licenses,
        licensesLoading: data.licensesLoading,
        devices: data.devices,
        devicesLoading: data.devicesLoading,
        business: data.business,
        businessLoading: data.businessLoading,
        locale,
        t,
      }),
    [data, locale, t],
  );

  const supportEmail =
    import.meta.env.VITE_PUBLIC_SUPPORT_EMAIL ?? "support@caisty.com";
  const statusPageUrl =
    (import.meta.env.VITE_STATUS_PAGE_URL as string | undefined)?.trim() || null;

  return (
    <div className={`${portalPageShell()} dashboard-home support-center`}>
      <SupportSummary
        summary={support.summary}
        loading={data.messagesLoading}
        isLight={isLight}
        t={t}
        supportEmail={supportEmail}
      />

      <SupportRequestForm isLight={isLight} t={t} onSubmitted={data.reloadMessages} />

      <SupportRequestsList
        messages={data.messages}
        loading={data.messagesLoading}
        isLight={isLight}
        locale={locale}
        t={t}
      />

      <SupportFooter
        supportEmail={supportEmail}
        supportEmailLabel={c.footerSupportEmail}
        statusPageUrl={statusPageUrl}
        statusPageLabel={c.footerStatusPage}
        privacyLabel={t.account.center.legalShort.privacy}
        termsLabel={t.account.center.legalShort.terms}
        isLight={isLight}
      />
    </div>
  );
}
