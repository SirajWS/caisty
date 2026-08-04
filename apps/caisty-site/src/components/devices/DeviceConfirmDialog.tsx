import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { ShieldAlert, TriangleAlert } from "lucide-react";

export type DeviceConfirmVariant = "default" | "warning" | "destructive";

type DeviceConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  notice?: string;
  cancelLabel: string;
  confirmLabel: string;
  variant?: DeviceConfirmVariant;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeviceConfirmDialog({
  open,
  title,
  description,
  notice,
  cancelLabel,
  confirmLabel,
  variant = "default",
  busy = false,
  error = null,
  onCancel,
  onConfirm,
}: DeviceConfirmDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onCancel]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const confirmClass =
    variant === "destructive"
      ? "devices-release-dialog-btn--destructive"
      : variant === "warning"
        ? "devices-release-dialog-btn--warning"
        : "devices-release-dialog-btn--primary";

  const Icon = variant === "destructive" ? TriangleAlert : ShieldAlert;

  return createPortal(
    <div className="devices-release-dialog-root">
      <button
        type="button"
        className="devices-release-dialog-backdrop"
        aria-label={cancelLabel}
        onClick={busy ? undefined : onCancel}
      />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="devices-release-dialog devices-confirm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`devices-release-dialog-icon devices-confirm-dialog-icon--${variant}`}
          aria-hidden
        >
          <Icon size={22} strokeWidth={2.25} />
        </div>
        <h2 id={titleId} className="devices-release-dialog-title">
          {title}
        </h2>
        <p className="devices-release-dialog-description">{description}</p>
        {notice ? (
          <div className="devices-release-dialog-notice" role="note">
            {notice}
          </div>
        ) : null}
        {error ? <p className="devices-release-dialog-error">{error}</p> : null}
        <div className="devices-release-dialog-actions">
          <button
            type="button"
            className="devices-release-dialog-btn devices-release-dialog-btn--secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`devices-release-dialog-btn ${confirmClass}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? `${confirmLabel}…` : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
