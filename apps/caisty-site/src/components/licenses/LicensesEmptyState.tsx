import { KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

export function LicensesEmptyState({
  headline,
  description,
  ctaLabel,
  ctaHref,
}: {
  headline: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <section className="orders-empty-state dashboard-panel dashboard-panel--wide">
      <div className="orders-empty-icon" aria-hidden>
        <KeyRound size={32} className="dashboard-icon--muted" />
      </div>
      <h2 className="orders-empty-headline">{headline}</h2>
      <p className="orders-empty-desc">{description}</p>
      <Link to={ctaHref} className="orders-empty-cta no-underline">
        {ctaLabel}
      </Link>
    </section>
  );
}
