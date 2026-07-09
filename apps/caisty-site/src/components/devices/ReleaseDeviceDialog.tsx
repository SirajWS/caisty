import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { TriangleAlert } from "lucide-react";

type ReleaseDeviceDialogProps = {
  open: boolean;
  title: string;
  description: string;
  notice: string;
  cancelLabel: string;
  confirmLabel: string;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ReleaseDeviceDialog({
  open,
  title,
  description,
  notice,
  cancelLabel,
  confirmLabel,
  busy = false,
  error = null,
  onCancel,
  onConfirm,
}: ReleaseDeviceDialogProps) {
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
        className="devices-release-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="devices-release-dialog-icon" aria-hidden>
          <TriangleAlert size={22} strokeWidth={2.25} />
        </div>
        <h2 id={titleId} className="devices-release-dialog-title">
          {title}
        </h2>
        <p className="devices-release-dialog-description">{description}</p>
        <div className="devices-release-dialog-notice" role="note">
          {notice}
        </div>
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
            className="devices-release-dialog-btn devices-release-dialog-btn--destructive"
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
