import type { PortalOrderStatusKey } from "../../lib/portal/portalSalesLabels";

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
      case "open":
      case "in_progress":
      case "ready":
        return "order-status-badge order-status-badge--progress";
      case "delivered":
      case "completed":
        return "order-status-badge order-status-badge--completed";
      case "cancelled":
        return "order-status-badge order-status-badge--cancelled";
      case "refunded":
        return "order-status-badge order-status-badge--refunded";
      default:
        return "order-status-badge order-status-badge--muted";
    }
  })();

  return <span className={toneClass}>{label}</span>;
}
