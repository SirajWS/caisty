import { Link } from "react-router-dom";
import { portalTextLink } from "../../lib/portalUi";

export function BusinessFooter({
  links,
  isLight,
}: {
  links: Array<{ id: string; label: string; href: string }>;
  isLight: boolean;
}) {
  return (
    <footer className="business-footer">
      <nav className="business-footer-nav" aria-label="Related">
        {links.map((link, index) => (
          <span key={link.id} className="business-footer-item">
            {index > 0 ? <span className="business-footer-sep" aria-hidden>·</span> : null}
            <Link to={link.href} className={portalTextLink(isLight)}>
              {link.label}
            </Link>
          </span>
        ))}
      </nav>
    </footer>
  );
}
