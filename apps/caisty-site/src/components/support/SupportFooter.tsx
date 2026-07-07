import { Link } from "react-router-dom";
import { LEGAL_PATHS } from "../../config/marketingRoutes";
import { portalTextLink } from "../../lib/portalUi";

export function SupportFooter({
  supportEmail,
  supportEmailLabel,
  statusPageUrl,
  statusPageLabel,
  privacyLabel,
  termsLabel,
  isLight,
}: {
  supportEmail: string;
  supportEmailLabel: string;
  statusPageUrl: string | null;
  statusPageLabel: string;
  privacyLabel: string;
  termsLabel: string;
  isLight: boolean;
}) {
  const linkClass = portalTextLink(isLight);

  return (
    <footer className="business-footer support-footer">
      <nav className="business-footer-nav" aria-label="Support links">
        <span className="business-footer-item">
          <a href={`mailto:${supportEmail}`} className={linkClass}>
            {supportEmailLabel}
          </a>
        </span>
        {statusPageUrl ? (
          <span className="business-footer-item">
            <span className="business-footer-sep" aria-hidden>·</span>
            <a
              href={statusPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {statusPageLabel}
            </a>
          </span>
        ) : null}
        <span className="business-footer-item">
          <span className="business-footer-sep" aria-hidden>·</span>
          <Link to={LEGAL_PATHS.privacy} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {privacyLabel}
          </Link>
        </span>
        <span className="business-footer-item">
          <span className="business-footer-sep" aria-hidden>·</span>
          <Link to={LEGAL_PATHS.terms} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {termsLabel}
          </Link>
        </span>
      </nav>
    </footer>
  );
}
