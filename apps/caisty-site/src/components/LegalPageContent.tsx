import { LEGAL_PATHS } from "../config/marketingRoutes";
import { openCookiePreferences } from "../lib/cookieConsent";
import { LegalDocumentLink } from "./LegalDocumentLink";
import type { LegalEmphasis, LegalLinkLabels, LegalSection } from "../lib/translations/legal/shared/types";

const LEGAL_PATH_BY_KEY: Record<keyof LegalLinkLabels, string> = {
  terms: LEGAL_PATHS.terms,
  privacy: LEGAL_PATHS.privacy,
  cookie: LEGAL_PATHS.cookie,
  eula: LEGAL_PATHS.eula,
  dpa: LEGAL_PATHS.dpa,
  imprint: LEGAL_PATHS.imprint,
  subprocessors: LEGAL_PATHS.subprocessors,
};

const EMAIL_BY_KEY: Record<string, string> = {
  infoEmail: "info@caisty.com",
  supportEmail: "support@caisty.com",
  privacyEmail: "privacy@caisty.com",
};

type RichTextProps = {
  text: string;
  labels: LegalLinkLabels;
  emphasis?: LegalEmphasis;
  isLight: boolean;
};

function renderInlineSegment(segment: string, props: RichTextProps, keyPrefix: string) {
  const { labels, emphasis, isLight } = props;
  const parts = segment.split(/(\{\{[a-zA-Z]+\}\}|\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    const token = part.match(/^\{\{([a-zA-Z]+)\}\}$/);
    if (token) {
      const key = token[1];
      if (key in LEGAL_PATH_BY_KEY) {
        const linkKey = key as keyof LegalLinkLabels;
        return (
          <LegalDocumentLink key={`${keyPrefix}-${index}`} to={LEGAL_PATH_BY_KEY[linkKey]} isLight={isLight} className="mkt-legal-link">
            {labels[linkKey]}
          </LegalDocumentLink>
        );
      }
      if (key === "licensedNotSold" || key === "commercialEfforts") {
        const value = emphasis?.[key];
        if (value) {
          return (
            <strong key={`${keyPrefix}-${index}`} className="font-semibold" style={{ color: "var(--mkt-text)" }}>
              {value}
            </strong>
          );
        }
      }
      if (key in EMAIL_BY_KEY) {
        return (
          <a key={`${keyPrefix}-${index}`} href={`mailto:${EMAIL_BY_KEY[key]}`} className="mkt-legal-link">
            {EMAIL_BY_KEY[key]}
          </a>
        );
      }
    }

    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return (
        <strong key={`${keyPrefix}-${index}`} className="font-semibold" style={{ color: "var(--mkt-text)" }}>
          {bold[1]}
        </strong>
      );
    }

    return <span key={`${keyPrefix}-${index}`}>{part}</span>;
  });
}

export function LegalRichText({ text, labels, emphasis, isLight }: RichTextProps) {
  return <>{renderInlineSegment(text, { text, labels, emphasis, isLight }, "rt")}</>;
}

export function LegalRichParagraph({ className, text, ...props }: RichTextProps & { className?: string }) {
  return (
    <p className={className}>
      <LegalRichText text={text} {...props} />
    </p>
  );
}

export function LegalSectionBlock({
  section,
  labels,
  emphasis,
  isLight,
}: {
  section: LegalSection;
  labels: LegalLinkLabels;
  emphasis?: LegalEmphasis;
  isLight: boolean;
}) {
  const richProps = { labels, emphasis, isLight };

  return (
    <section className="mkt-legal-section">
      <h2 className="mkt-legal-section-title">{section.title}</h2>
      {section.notice ? (
        <div className="mkt-legal-notice">
          <LegalRichText text={section.notice} {...richProps} />
        </div>
      ) : null}
      {section.paragraphs?.map((paragraph, index) => (
        <LegalRichParagraph key={index} text={paragraph} className="mkt-legal-p" {...richProps} />
      ))}
      {section.list && section.list.length > 0 ? (
        <ul className="mkt-legal-list">
          {section.list.map((item, index) => (
            <li key={index}>
              <LegalRichText text={item} {...richProps} />
            </li>
          ))}
        </ul>
      ) : null}
      {section.subsections?.map((subsection) => (
        <div key={subsection.title} className="mkt-legal-subsection">
          <h3 className="mkt-legal-subsection-title">{subsection.title}</h3>
          {subsection.paragraphs?.map((paragraph, index) => (
            <LegalRichParagraph key={index} text={paragraph} className="mkt-legal-p" {...richProps} />
          ))}
          {subsection.list && subsection.list.length > 0 ? (
            <ul className="mkt-legal-list">
              {subsection.list.map((item, index) => (
                <li key={index}>
                  <LegalRichText text={item} {...richProps} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
      {section.table ? (
        <div className="mkt-legal-table-wrap">
          <table className="mkt-legal-table">
            <thead>
              <tr>
                {section.table.headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {section.cookiePreferencesLabel ? (
        <button type="button" onClick={openCookiePreferences} className="mkt-btn-primary mkt-legal-cookie-btn">
          {section.cookiePreferencesLabel}
        </button>
      ) : null}
    </section>
  );
}

export function LegalContactCard({
  contact,
  showOwner,
  labels,
  emphasis,
  isLight,
}: {
  contact: {
    company: string;
    street: string;
    city: string;
    country: string;
    generalInquiries: string;
    supportLabel: string;
    privacyLabel: string;
    taxIdLabel: string;
    taxId: string;
    ownerLabel?: string;
    ownerName?: string;
    imprintNote?: string;
  };
  showOwner?: boolean;
  labels: LegalLinkLabels;
  emphasis?: LegalEmphasis;
  isLight: boolean;
}) {
  const richProps = { labels, emphasis, isLight };

  return (
    <>
      <div className="mkt-legal-card">
        <p className="mkt-legal-card-title">{contact.company}</p>
        {showOwner && contact.ownerLabel && contact.ownerName ? (
          <p>
            {contact.ownerLabel}: {contact.ownerName}
          </p>
        ) : null}
        <p>{contact.street}</p>
        <p>{contact.city}</p>
        <p>{contact.country}</p>
        <p className="pt-2">
          {contact.generalInquiries}:{" "}
          <a href="mailto:info@caisty.com" className="mkt-legal-link">
            info@caisty.com
          </a>
        </p>
        <p>
          {contact.supportLabel}:{" "}
          <a href="mailto:support@caisty.com" className="mkt-legal-link">
            support@caisty.com
          </a>
        </p>
        <p>
          {contact.privacyLabel}:{" "}
          <a href="mailto:privacy@caisty.com" className="mkt-legal-link">
            privacy@caisty.com
          </a>
        </p>
        <p className="pt-2">
          {contact.taxIdLabel}: {contact.taxId}
        </p>
      </div>
      {contact.imprintNote ? (
        <LegalRichParagraph text={contact.imprintNote} className="mkt-legal-p" {...richProps} />
      ) : null}
    </>
  );
}

export function LegalRelatedDocuments({
  related,
  includeSubprocessors = true,
}: {
  related: {
    title: string;
    terms: string;
    privacy: string;
    cookie: string;
    eula: string;
    dpa: string;
    imprint: string;
    subprocessors: string;
  };
  includeSubprocessors?: boolean;
}) {
  const links: { to: string; label: string }[] = [
    { to: LEGAL_PATHS.terms, label: related.terms },
    { to: LEGAL_PATHS.privacy, label: related.privacy },
    { to: LEGAL_PATHS.cookie, label: related.cookie },
    { to: LEGAL_PATHS.eula, label: related.eula },
    { to: LEGAL_PATHS.dpa, label: related.dpa },
    { to: LEGAL_PATHS.imprint, label: related.imprint },
  ];

  if (includeSubprocessors) {
    links.push({ to: LEGAL_PATHS.subprocessors, label: related.subprocessors });
  }

  return (
    <aside className="mkt-legal-related" aria-labelledby="legal-related-heading">
      <h2 id="legal-related-heading" className="mkt-legal-related-title">
        {related.title}
      </h2>
      <nav className="mkt-legal-related-grid" aria-label={related.title}>
        {links.map((link) => (
          <LegalDocumentLink key={link.to} to={link.to} className="mkt-legal-related-link">
            {link.label}
          </LegalDocumentLink>
        ))}
      </nav>
    </aside>
  );
}
