import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import type { SupportContactOption } from "../../lib/support/types";
import { portalTextLink } from "../../lib/portalUi";

export function SupportContactOptions({
  options,
  title,
  isLight,
}: {
  options: SupportContactOption[];
  title: string;
  isLight: boolean;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <ul className="support-contact-list">
        {options.map((opt) => (
          <li key={opt.id}>
            {opt.href?.startsWith("mailto:") || opt.href?.startsWith("http") ? (
              <a href={opt.href} className={`support-contact-link ${portalTextLink(isLight)}`}>
                <span>
                  <strong>{opt.label}</strong>
                  <span className="support-contact-value">{opt.value}</span>
                </span>
              </a>
            ) : opt.href ? (
              <Link
                to={opt.href}
                target={opt.href.startsWith("/") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className={`support-contact-link ${portalTextLink(isLight)}`}
              >
                <span>
                  <strong>{opt.label}</strong>
                  <span className="support-contact-value">{opt.value}</span>
                </span>
                <ExternalLink size={12} aria-hidden />
              </Link>
            ) : (
              <div className="support-contact-link support-contact-link--static">
                <span>
                  <strong>{opt.label}</strong>
                  <span className="support-contact-value">{opt.value}</span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
