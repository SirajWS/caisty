import { useLanguage } from "../lib/LanguageContext";
import { useTheme } from "../lib/theme";
import { LegalPageShell } from "./LegalPageShell";
import {
  LegalContactCard,
  LegalRelatedDocuments,
  LegalRichText,
  LegalSectionBlock,
} from "./LegalPageContent";
import type { LegalDocumentCopy } from "../lib/translations/legal/shared/types";
import type { Language } from "../lib/translations/types";

type LegalDocumentPageProps = {
  getCopy: (language: Language) => LegalDocumentCopy;
  includeSubprocessorsInRelated?: boolean;
};

export function LegalDocumentPage({ getCopy, includeSubprocessorsInRelated = true }: LegalDocumentPageProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = getCopy(language);
  const isLight = theme === "light";

  const richProps = {
    labels: t.linkLabels,
    emphasis: t.emphasis,
    isLight,
  };

  return (
    <LegalPageShell
      documentLabel={t.documentLabel}
      title={t.title}
      lastUpdatedLabel={t.lastUpdatedLabel}
      effectiveDate={t.effectiveDate}
      versionLabel={t.versionLabel}
      version={t.version}
      intro={t.intro}
      linkLabels={t.linkLabels}
      emphasis={t.emphasis}
      related={
        <LegalRelatedDocuments related={t.related} includeSubprocessors={includeSubprocessorsInRelated} />
      }
    >
      {t.sections.map((section) => (
        <LegalSectionBlock key={section.title} section={section} {...richProps} />
      ))}

      <section className="mkt-legal-section">
        <h2 className="mkt-legal-section-title">{t.contactSectionTitle}</h2>
        {t.contactSectionIntro ? (
          <p className="mkt-legal-p">
            <LegalRichText text={t.contactSectionIntro} labels={t.linkLabels} emphasis={t.emphasis} isLight={isLight} />
          </p>
        ) : null}
        <LegalContactCard contact={t.contact} showOwner={t.showOwnerInContact} {...richProps} />
      </section>
    </LegalPageShell>
  );
}
