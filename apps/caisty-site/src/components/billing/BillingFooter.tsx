import { Link } from "react-router-dom";
import { portalTextLink } from "../../lib/portalUi";

type FooterLink = { id: string; label: string; href: string };

export function BillingFooter({
  links,
  isLight,
}: {
  links: FooterLink[];
  isLight: boolean;
}) {
  return (
    <footer className="business-footer billing-footer">
      <nav className="business-footer-nav" aria-label="Related">
        {links.map((link, index) => (
          <span key={link.id} className="business-footer-item">
            {index > 0 ? <span className="business-footer-sep" aria-hidden>·</span> : null}
            {link.href.startsWith("#") ? (
              <a href={link.href} className={portalTextLink(isLight)}>
                {link.label}
              </a>
            ) : (
              <Link to={link.href} className={portalTextLink(isLight)}>
                {link.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </footer>
  );
}
