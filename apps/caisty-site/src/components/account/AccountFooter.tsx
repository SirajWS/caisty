import { Link } from "react-router-dom";
import type { LegalDocumentLink } from "../../lib/account/types";
import { portalTextLink } from "../../lib/portalUi";

export function AccountFooter({
  documents,
  supportHref,
  supportLabel,
  isLight,
}: {
  documents: LegalDocumentLink[];
  supportHref: string;
  supportLabel: string;
  isLight: boolean;
}) {
  return (
    <footer className="account-footer">
      <nav className="account-footer-legal" aria-label="Legal">
        {documents.map((doc, index) => (
          <span key={doc.id} className="account-footer-legal-item">
            {index > 0 ? <span className="account-footer-sep" aria-hidden>·</span> : null}
            <Link
              to={doc.path}
              target="_blank"
              rel="noopener noreferrer"
              className={portalTextLink(isLight)}
              title={doc.title}
            >
              {doc.shortTitle}
            </Link>
          </span>
        ))}
      </nav>
      <a href={supportHref} className={`account-footer-support ${portalTextLink(isLight)}`}>
        {supportLabel}
      </a>
    </footer>
  );
}
