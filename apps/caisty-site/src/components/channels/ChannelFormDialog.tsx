import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Copy, X } from "lucide-react";

import type { PortalChannelWriteBody } from "../../lib/channels/portalChannelApi";
import { portalInputClass, portalPrimaryCta, portalSectionLabel } from "../../lib/portalUi";

type ChannelFormDialogProps = {
  open: boolean;
  title: string;
  values: PortalChannelWriteBody;
  error: string | null;
  busy: boolean;
  isLight: boolean;
  webhookPath: string;
  secretsUnavailableNotice: string;
  testOrderLaterNotice: string;
  labels: Record<string, string>;
  onChange: (next: PortalChannelWriteBody) => void;
  onCancel: () => void;
  onSave: () => void;
  onCopyWebhook: () => void;
};

const STATUS_KEYS = [
  "created",
  "accepted",
  "ready",
  "dispatched",
  "delivered",
  "canceled",
] as const;

export function ChannelFormDialog({
  open,
  title,
  values,
  error,
  busy,
  isLight,
  webhookPath,
  secretsUnavailableNotice,
  testOrderLaterNotice,
  labels,
  onChange,
  onCancel,
  onSave,
  onCopyWebhook,
}: ChannelFormDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const setField = <K extends keyof PortalChannelWriteBody>(
    key: K,
    value: PortalChannelWriteBody[K],
  ) => onChange({ ...values, [key]: value });

  return createPortal(
    <div className="portal-channel-dialog-root">
      <button
        type="button"
        className="portal-channel-dialog-backdrop"
        aria-label={labels.cancel}
        onClick={busy ? undefined : onCancel}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="portal-channel-dialog"
      >
        <div className="portal-channel-dialog-header">
          <h2 id={titleId} className="portal-channel-dialog-title">
            {title}
          </h2>
          <button
            type="button"
            className="portal-icon-btn"
            aria-label={labels.cancel}
            disabled={busy}
            onClick={onCancel}
          >
            <X size={18} />
          </button>
        </div>

        <div className="portal-channel-dialog-body">
          {error ? <div className="portal-channel-alert">{error}</div> : null}

          <section className="portal-channel-form-section">
            <h3 className={portalSectionLabel(isLight)}>{labels.sectionGeneral}</h3>
            <label className="portal-channel-field">
              <span>{labels.displayName}</span>
              <input
                className={portalInputClass(isLight)}
                value={values.name}
                disabled={busy}
                onChange={(e) => setField("name", e.target.value)}
              />
            </label>
            <label className="portal-channel-field">
              <span>{labels.slug}</span>
              <input
                className={portalInputClass(isLight)}
                value={values.slug}
                disabled={busy}
                onChange={(e) => setField("slug", e.target.value.toLowerCase())}
              />
            </label>
            <label className="portal-channel-toggle">
              <input
                type="checkbox"
                checked={values.enabled}
                disabled={busy}
                onChange={(e) => setField("enabled", e.target.checked)}
              />
              <span>{labels.enabled}</span>
            </label>
            <label className="portal-channel-field">
              <span>{labels.providerType}</span>
              <input
                className={portalInputClass(isLight)}
                value={values.providerType ?? ""}
                disabled={busy}
                onChange={(e) => setField("providerType", e.target.value)}
              />
            </label>
            <label className="portal-channel-field">
              <span>{labels.provider}</span>
              <input
                className={portalInputClass(isLight)}
                value={values.provider ?? ""}
                disabled={busy}
                onChange={(e) => setField("provider", e.target.value)}
              />
            </label>
            <label className="portal-channel-field">
              <span>{labels.providerName}</span>
              <input
                className={portalInputClass(isLight)}
                value={values.providerName ?? ""}
                disabled={busy}
                onChange={(e) => setField("providerName", e.target.value)}
              />
            </label>
            <label className="portal-channel-field">
              <span>{labels.mode}</span>
              <input
                className={portalInputClass(isLight)}
                value={values.mode ?? ""}
                disabled={busy}
                onChange={(e) => setField("mode", e.target.value)}
              />
            </label>
            <label className="portal-channel-field">
              <span>{labels.storeId}</span>
              <input
                className={portalInputClass(isLight)}
                value={values.storeId ?? ""}
                disabled={busy}
                onChange={(e) => setField("storeId", e.target.value)}
              />
            </label>
            <label className="portal-channel-field">
              <span>{labels.logo}</span>
              <textarea
                className={`${portalInputClass(isLight)} portal-channel-textarea`}
                value={values.logoDataUrl ?? ""}
                disabled={busy}
                rows={3}
                onChange={(e) => setField("logoDataUrl", e.target.value)}
              />
            </label>
            <label className="portal-channel-field">
              <span>{labels.notes}</span>
              <textarea
                className={`${portalInputClass(isLight)} portal-channel-textarea`}
                value={values.notes ?? ""}
                disabled={busy}
                rows={3}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </label>
          </section>

          <section className="portal-channel-form-section">
            <h3 className={portalSectionLabel(isLight)}>{labels.sectionRealtime}</h3>
            <label className="portal-channel-field">
              <span>{labels.pusherAppKey}</span>
              <input
                className={portalInputClass(isLight)}
                value={values.pusherAppKey ?? ""}
                disabled={busy}
                onChange={(e) => setField("pusherAppKey", e.target.value)}
              />
            </label>
            <label className="portal-channel-field">
              <span>{labels.pusherCluster}</span>
              <input
                className={portalInputClass(isLight)}
                value={values.pusherCluster ?? ""}
                disabled={busy}
                onChange={(e) => setField("pusherCluster", e.target.value)}
              />
            </label>
            <label className="portal-channel-field">
              <span>{labels.pusherChannel}</span>
              <input
                className={portalInputClass(isLight)}
                value={values.pusherChannel ?? ""}
                disabled={busy}
                onChange={(e) => setField("pusherChannel", e.target.value)}
              />
            </label>
          </section>

          <section className="portal-channel-form-section">
            <h3 className={portalSectionLabel(isLight)}>{labels.sectionAck}</h3>
            <label className="portal-channel-toggle">
              <input
                type="checkbox"
                checked={values.ackEnabled ?? false}
                disabled={busy}
                onChange={(e) => setField("ackEnabled", e.target.checked)}
              />
              <span>{labels.ackEnabled}</span>
            </label>
            <label className="portal-channel-field">
              <span>{labels.ackTimeout}</span>
              <input
                type="number"
                min={1}
                className={portalInputClass(isLight)}
                value={values.ackTimeoutSec ?? 30}
                disabled={busy}
                onChange={(e) =>
                  setField("ackTimeoutSec", Number.parseInt(e.target.value, 10) || 1)
                }
              />
            </label>
          </section>

          <section className="portal-channel-form-section">
            <h3 className={portalSectionLabel(isLight)}>{labels.sectionStatusMap}</h3>
            <div className="portal-channel-status-grid">
              {STATUS_KEYS.map((key) => (
                <label key={key} className="portal-channel-field">
                  <span>{labels[`status_${key}`] ?? key}</span>
                  <input
                    className={portalInputClass(isLight)}
                    value={String(values.statusMapping?.[key] ?? "")}
                    disabled={busy}
                    onChange={(e) =>
                      setField("statusMapping", {
                        ...(values.statusMapping ?? {}),
                        [key]: e.target.value,
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="portal-channel-form-section">
            <h3 className={portalSectionLabel(isLight)}>{labels.sectionWebhook}</h3>
            <div className="portal-channel-webhook-row">
              <code className="portal-channel-webhook-path">{webhookPath}</code>
              <button
                type="button"
                className="portal-channel-icon-btn"
                disabled={busy}
                onClick={onCopyWebhook}
              >
                <Copy size={16} />
                <span>{labels.copyWebhook}</span>
              </button>
            </div>
          </section>

          <section className="portal-channel-form-section">
            <h3 className={portalSectionLabel(isLight)}>{labels.sectionSecrets}</h3>
            <p className="portal-channel-muted">{secretsUnavailableNotice}</p>
            <p className="portal-channel-muted">{testOrderLaterNotice}</p>
          </section>
        </div>

        <div className="portal-channel-dialog-footer">
          <button type="button" className="portal-channel-btn-secondary" disabled={busy} onClick={onCancel}>
            {labels.cancel}
          </button>
          <button type="button" className={portalPrimaryCta()} disabled={busy} onClick={onSave}>
            {busy ? labels.saving : labels.save}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
