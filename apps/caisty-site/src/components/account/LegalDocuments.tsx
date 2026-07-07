import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import type { LegalDocumentLink } from "../../lib/account/types";
import { portalTextLink } from "../../lib/portalUi";

export function LegalDocuments({
  documents,
  title,
  subtitle,
  isLight,
}: {
  documents: LegalDocumentLink[];
  title: string;
  subtitle: string;
  isLight: boolean;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <p className="dashboard-text-muted text-xs mt-0 mb-3">{subtitle}</p>
      <ul className="account-legal-list">
        {documents.map((doc) => (
          <li key={doc.id}>
            <Link
              to={doc.path}
              target="_blank"
              rel="noopener noreferrer"
              className={`account-legal-link ${portalTextLink(isLight)}`}
            >
              <span>{doc.title}</span>
              <ExternalLink size={12} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
