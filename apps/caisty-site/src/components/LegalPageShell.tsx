import { useEffect, type ReactNode } from "react";
import { useTheme } from "../lib/theme";
import { LegalRichParagraph } from "./LegalPageContent";
import type { LegalEmphasis, LegalLinkLabels } from "../lib/translations/legal/shared/types";

type LegalPageShellProps = {
  documentLabel: string;
  title: string;
  lastUpdatedLabel: string;
  effectiveDate: string;
  versionLabel?: string;
  version?: string;
  intro: string;
  linkLabels: LegalLinkLabels;
  emphasis?: LegalEmphasis;
  children: ReactNode;
  related?: ReactNode;
};

export function LegalPageShell({
  documentLabel,
  title,
  lastUpdatedLabel,
  effectiveDate,
  versionLabel,
  version,
  intro,
  linkLabels,
  emphasis,
  children,
  related,
}: LegalPageShellProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  useEffect(() => {
    document.title = `${title} – Caisty`;
  }, [title]);

  const richProps = { labels: linkLabels, emphasis, isLight };

  return (
    <div
      className={`legal-page marketing-site ${isLight ? "" : "marketing-site--dark"}`}
      style={{ background: "var(--mkt-bg)", color: "var(--mkt-text)" }}
    >
      <section className="mkt-section border-b" style={{ borderColor: "var(--mkt-border)" }}>
        <div className="mkt-shell mkt-legal-hero">
          <div className="mkt-eyebrow">
            <span className="mkt-eyebrow-dot" aria-hidden />
            {documentLabel}
          </div>
          <h1 className="mkt-display mkt-legal-title">{title}</h1>
          <p className="mkt-legal-meta">
            {lastUpdatedLabel}: {effectiveDate}
            {versionLabel && version ? ` · ${versionLabel}: ${version}` : null}
          </p>
          <LegalRichParagraph text={intro} className="mkt-legal-intro" {...richProps} />
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-shell mkt-legal-body">
          <article className="mkt-legal-prose">{children}</article>
          {related}
        </div>
      </section>
    </div>
  );
}
