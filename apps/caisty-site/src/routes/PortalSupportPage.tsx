import React from "react";
import { usePortalOutlet } from "./PortalLayout";
import { useTheme } from "../lib/theme";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalLocaleTag } from "../lib/portalLocale";
import { usePortalSupportData } from "../lib/support/usePortalSupportData";
import { deriveSupportState } from "../lib/support/deriveSupportState";
import { SupportOverview } from "../components/support/SupportOverview";
import { SupportRequestForm } from "../components/support/SupportRequestForm";
import { SupportRequestsList } from "../components/support/SupportRequestsList";
import { HelpCategories } from "../components/support/HelpCategories";
import { SupportQuickActions } from "../components/support/SupportQuickActions";
import { SystemServiceStatus } from "../components/support/SystemServiceStatus";
import { RemoteSupportCard } from "../components/support/RemoteSupportCard";
import { SupportContactOptions } from "../components/support/SupportContactOptions";
import { KnowledgeBase } from "../components/support/KnowledgeBase";
import { portalPageShell, portalPageSubtitle, portalPageTitle } from "../lib/portalUi";

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

  return (
    <div className={`${portalPageShell()} dashboard-home support-center`}>
      <header className="space-y-1">
        <h1 className={portalPageTitle(isLight)}>{c.pageTitle}</h1>
        <p className={portalPageSubtitle(isLight)}>{c.pageSubtitle}</p>
      </header>

      <SupportOverview
        kpis={support.overview}
        loading={data.messagesLoading && data.licensesLoading}
        isLight={isLight}
      />

      <div className="live-dashboard-split">
        <SupportQuickActions
          actions={support.quickActions}
          title={c.sectionQuickActions}
          isLight={isLight}
        />
        <SystemServiceStatus items={support.systemStatus} title={c.sectionSystemStatus} />
      </div>

      <div className="live-dashboard-split">
        <SupportRequestForm isLight={isLight} t={t} onSubmitted={data.reloadMessages} />
        <SupportRequestsList
          messages={data.messages}
          loading={data.messagesLoading}
          isLight={isLight}
          locale={locale}
          t={t}
        />
      </div>

      <HelpCategories categories={support.helpCategories} title={c.sectionHelpCategories} />

      <div className="live-dashboard-split">
        <RemoteSupportCard items={support.remoteSupport} title={c.sectionRemoteSupport} />
        <KnowledgeBase items={support.knowledgeBase} title={c.sectionKnowledgeBase} />
      </div>

      <SupportContactOptions
        options={support.contactOptions}
        title={c.sectionContact}
        isLight={isLight}
      />
    </div>
  );
}
