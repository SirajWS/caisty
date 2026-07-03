import { StatusPill } from "../components/ui";

function norm(status: string) {
  return status.toLowerCase().trim();
}

export function LicenseStatusPill({ status }: { status: string }) {
  const s = norm(status);
  if (s === "active") return <StatusPill tone="green" label="Active" />;
  if (s === "revoked") return <StatusPill tone="red" label="Revoked" />;
  if (s === "expired") return <StatusPill tone="gray" label="Expired" />;
  return <StatusPill tone="gray" label={status} />;
}

export function SeatsStatus({ used, total }: { used: number; total: number }) {
  const full = total > 0 && used >= total;
  if (full) {
    return (
      <StatusPill
        tone="amber"
        label={`Full (${used}/${total})`}
      />
    );
  }
  return (
    <span className="ds-muted">
      {used}/{total}
    </span>
  );
}

export function DeviceStatusPill({ status }: { status: string }) {
  const s = norm(status);
  if (s === "active") return <StatusPill tone="green" label="Active" />;
  return <StatusPill tone="gray" label={status} />;
}

export function SubscriptionStatusPill({ status }: { status: string | null | undefined }) {
  const s = norm(status ?? "");
  if (s === "active") return <StatusPill tone="green" label="Active" />;
  if (s === "pending") return <StatusPill tone="amber" label="Pending" />;
  if (s === "canceled" || s === "cancelled") {
    return <StatusPill tone="gray" label="Canceled" />;
  }
  if (s === "ended") return <StatusPill tone="gray" label="Ended" />;
  return <StatusPill tone="gray" label={status ?? "Unknown"} />;
}

export function InvoiceStatusPill({ status }: { status: string }) {
  const s = norm(status);
  if (s === "paid") return <StatusPill tone="green" label="Paid" />;
  if (s === "open") return <StatusPill tone="amber" label="Open" />;
  if (s === "closed") return <StatusPill tone="gray" label="Closed" />;
  if (s === "void" || s === "cancelled") {
    return <StatusPill tone="gray" label={s === "void" ? "Void" : "Cancelled"} />;
  }
  return <StatusPill tone="gray" label={status} />;
}

export function PaymentStatusPill({ status }: { status: string }) {
  const s = norm(status);
  if (s === "succeeded" || s === "success" || s === "paid") {
    return <StatusPill tone="green" label={s === "paid" ? "Paid" : "Succeeded"} />;
  }
  if (s === "failed") return <StatusPill tone="red" label="Failed" />;
  if (s === "pending") return <StatusPill tone="amber" label="Pending" />;
  return <StatusPill tone="gray" label={status} />;
}

export function WebhookStatusPill({ status }: { status: string }) {
  const s = norm(status);
  if (s === "ok") return <StatusPill tone="green" label="OK" />;
  if (s === "processed" || s === "success") {
    return <StatusPill tone="green" label="Processed" />;
  }
  if (s === "failed") return <StatusPill tone="red" label="Failed" />;
  return <StatusPill tone="amber" label={status} />;
}

export function NotificationReadPill({ isRead }: { isRead: boolean }) {
  if (isRead) return <StatusPill tone="gray" label="Read" />;
  return <StatusPill tone="amber" label="New" />;
}

export function AccountStatusPill({ status }: { status: string | null | undefined }) {
  const s = norm(status ?? "");
  if (s === "active") return <StatusPill tone="green" label="Active" />;
  if (s === "inactive") return <StatusPill tone="gray" label="Inactive" />;
  return <StatusPill tone="gray" label={status ?? "Unknown"} />;
}
