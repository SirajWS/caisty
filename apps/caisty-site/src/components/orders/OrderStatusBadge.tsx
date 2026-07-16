import type { PortalOrderStatusKey } from "../../lib/portal/portalSalesLabels";

/**
 * Order lifecycle badge — part of the Caisty detail drawer badge system.
 * Uses `.caisty-badge` so status and payment share one visual language.
 */
export function OrderStatusBadge({
  status,
  label,
}: {
  status: PortalOrderStatusKey | string;
  label: string;
}) {
  const normalized = status.trim().toLowerCase().replace(/\s+/g, "_");
  const toneClass = (() => {
    switch (normalized) {
      case "new":
      case "accepted":
      case "open":
      case "in_progress":
      case "ready":
        return "caisty-badge caisty-badge--progress";
      case "delivered":
      case "completed":
        return "caisty-badge caisty-badge--success";
      case "cancelled":
        return "caisty-badge caisty-badge--neutral";
      case "refunded":
        return "caisty-badge caisty-badge--danger";
      default:
        return "caisty-badge caisty-badge--neutral";
    }
  })();

  return <span className={toneClass}>{label}</span>;
}
