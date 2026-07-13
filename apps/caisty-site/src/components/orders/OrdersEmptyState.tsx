import { Monitor, ShoppingBag } from "lucide-react";
import type { PosReleaseConfig } from "../../config/posConfig";
import { openDesktopPos } from "../devices/openDesktopPos";

export function OrdersEmptyState({
  headline,
  description,
  ctaLabel,
  release,
}: {
  headline: string;
  description: string;
  ctaLabel: string;
  release: PosReleaseConfig;
}) {
  return (
    <section className="orders-empty-state dashboard-panel dashboard-panel--wide">
      <div className="orders-empty-icon" aria-hidden>
        <ShoppingBag size={32} className="dashboard-icon--muted" />
      </div>
      <h2 className="orders-empty-headline">{headline}</h2>
      <p className="orders-empty-desc">{description}</p>
      <button
        type="button"
        className="orders-empty-cta"
        onClick={() => openDesktopPos(release)}
      >
        <Monitor size={16} />
        {ctaLabel}
      </button>
    </section>
  );
}
