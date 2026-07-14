import { useEffect, type ReactNode } from "react";
import { Button } from "../../components/ui";

export function ReceiptActionDialog({
  open,
  title,
  onClose,
  children,
  footer,
  error,
  success,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  error?: string | null;
  success?: string | null;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="admin-backdrop is-open"
      style={{ zIndex: 40 }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="admin-card"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(520px, calc(100vw - 32px))",
          maxHeight: "calc(100vh - 48px)",
          overflow: "auto",
          padding: 24,
          zIndex: 41,
        }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-action-dialog-title"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 id="receipt-action-dialog-title" style={{ margin: 0, fontSize: 20 }}>
            {title}
          </h2>
          <Button variant="link" onClick={onClose}>
            Close
          </Button>
        </div>

        {error ? <div className="admin-error-banner">{error}</div> : null}
        {success ? (
          <div
            className="admin-card"
            style={{
              marginBottom: 16,
              padding: 12,
              borderColor: "rgba(34, 197, 94, 0.35)",
            }}
          >
            {success}
          </div>
        ) : null}

        {children}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 20,
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}
