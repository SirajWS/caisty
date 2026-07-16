import type { PortalOrderPaymentStatus } from "../../lib/portalApi";

/**
 * Payment badge for the Caisty detail drawer reference system.
 * Shares visual language with OrderStatusBadge (`.caisty-badge`).
 */
export function OrderPaymentBadge({
  status,
  methodLabel,
  pendingLabel,
  paidLabel,
}: {
  status: PortalOrderPaymentStatus | string | null | undefined;
  methodLabel: string;
  pendingLabel: string;
  paidLabel?: string;
}) {
  const normalized = (status ?? "unknown").trim().toLowerCase();

  if (normalized === "pending") {
    return (
      <span className="caisty-badge caisty-badge--warning">{pendingLabel}</span>
    );
  }

  if (normalized === "cancelled") {
    return (
      <span className="caisty-badge caisty-badge--danger">{methodLabel}</span>
    );
  }

  if (normalized === "paid") {
    return (
      <span className="caisty-badge caisty-badge--success">
        {methodLabel || paidLabel || "Paid"}
      </span>
    );
  }

  return (
    <span className="caisty-badge caisty-badge--neutral">{methodLabel}</span>
  );
}
