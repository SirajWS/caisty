import React from "react";
import { Download, Plus, RefreshCw, Upload } from "lucide-react";

import { DeviceConfirmDialog } from "../components/devices/DeviceConfirmDialog";
import { ChannelFormDialog } from "../components/channels/ChannelFormDialog";
import {
  channelToFormValues,
  downloadPortalChannelsExport,
  emptyChannelForm,
  PORTAL_CHANNEL_SLUG_RE,
  previewPortalChannelImport,
  type PortalChannel,
  type PortalChannelWriteBody,
} from "../lib/channels/portalChannelApi";
import { usePortalChannels } from "../lib/channels/usePortalChannels";
import { useLanguage } from "../lib/LanguageContext";
import { getPortalTranslations } from "../lib/translations";
import { portalPageShell, portalPageSubtitle, portalPageTitle } from "../lib/portalUi";
import { useTheme } from "../lib/theme";

function validateForm(values: PortalChannelWriteBody, labels: Record<string, string>): string | null {
  if (!values.name.trim()) return labels.errorNameRequired;
  if (!values.slug.trim()) return labels.errorSlugRequired;
  if (!PORTAL_CHANNEL_SLUG_RE.test(values.slug.trim())) return labels.errorSlugFormat;
  if (!values.providerType?.trim() && !values.provider?.trim() && !values.providerName?.trim()) {
    return labels.errorProviderRequired;
  }
  if (values.ackEnabled && (values.ackTimeoutSec == null || values.ackTimeoutSec < 1)) {
    return labels.errorAckTimeout;
  }
  return null;
}

export default function PortalChannelsPage() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const t = getPortalTranslations(language);
  const c = t.channels;
  const mgmt = usePortalChannels();

  const [formOpen, setFormOpen] = React.useState(false);
  const [formValues, setFormValues] = React.useState<PortalChannelWriteBody>(emptyChannelForm());
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<PortalChannel | null>(null);
  const [importConfirmOpen, setImportConfirmOpen] = React.useState(false);
  const [pendingImport, setPendingImport] = React.useState<unknown[] | null>(null);
  const [importPreview, setImportPreview] = React.useState<{
    added: number;
    updated: number;
    unchanged: number;
    keptExisting: number;
  } | null>(null);
  const importInputRef = React.useRef<HTMLInputElement>(null);
  const importInputId = React.useId();

  const formLabels = React.useMemo(
    () => ({
      sectionGeneral: c.formSectionGeneral,
      sectionRealtime: c.formSectionRealtime,
      sectionAck: c.formSectionAck,
      sectionStatusMap: c.formSectionStatusMap,
      sectionSecrets: c.formSectionSecrets,
      displayName: c.formDisplayName,
      slug: c.formSlug,
      enabled: c.formEnabled,
      providerType: c.formProviderType,
      provider: c.formProvider,
      providerName: c.formProviderName,
      mode: c.formMode,
      storeId: c.formStoreId,
      logo: c.formLogo,
      notes: c.formNotes,
      pusherAppKey: c.formPusherAppKey,
      pusherCluster: c.formPusherCluster,
      pusherChannel: c.formPusherChannel,
      ackEnabled: c.formAckEnabled,
      ackTimeout: c.formAckTimeout,
      status_created: c.statusCreated,
      status_accepted: c.statusAccepted,
      status_ready: c.statusReady,
      status_dispatched: c.statusDispatched,
      status_delivered: c.statusDelivered,
      status_canceled: c.statusCanceled,
      cancel: c.cancel,
      save: c.save,
      saving: c.saving,
    }),
    [c],
  );

  const openCreate = () => {
    setEditingId(null);
    setFormValues(emptyChannelForm());
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (channel: PortalChannel) => {
    setEditingId(channel.id);
    setFormValues(channelToFormValues(channel));
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (mgmt.saving) return;
    setFormOpen(false);
    setFormError(null);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  };

  const saveForm = async () => {
    const validationError = validateForm(formValues, c as unknown as Record<string, string>);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    try {
      await mgmt.saveChannel(formValues, editingId ?? undefined);
      setFormOpen(false);
      showToast(editingId ? c.toastUpdated : c.toastCreated);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : c.actionError);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await downloadPortalChannelsExport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "channels.json";
      a.click();
      URL.revokeObjectURL(url);
      showToast(c.toastExported);
    } catch (err) {
      showToast(err instanceof Error ? err.message : c.actionError);
    }
  };

  const parseImportFile = async (file: File) => {
    const text = await file.text();
    if (!text.trim()) {
      showToast(c.importEmptyFile);
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      showToast(c.importInvalidJson);
      return;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      showToast(c.importInvalidArray);
      return;
    }
    const preview = previewPortalChannelImport(mgmt.channels, parsed);
    if (!preview.ok) {
      showToast(preview.message);
      return;
    }
    setImportPreview({
      added: preview.added,
      updated: preview.updated,
      unchanged: preview.unchanged,
      keptExisting: preview.keptExisting,
    });
    setPendingImport(parsed);
    setImportConfirmOpen(true);
  };

  const confirmImport = async () => {
    if (!pendingImport) return;
    try {
      const result = await mgmt.mergeImport(pendingImport);
      setImportConfirmOpen(false);
      setPendingImport(null);
      setImportPreview(null);
      const summary = [
        c.importSuccessAdded.replace("{{count}}", String(result.added)),
        c.importSuccessUpdated.replace("{{count}}", String(result.updated)),
      ].join(", ");
      showToast(`${c.importSuccessToast.replace("{{summary}}", summary)} ${result.secretImportNotice}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : c.importFailed);
    }
  };

  const importConfirmDescription = importPreview
    ? [
        c.importPreviewAdded.replace("{{count}}", String(importPreview.added)),
        c.importPreviewUpdated.replace("{{count}}", String(importPreview.updated)),
        c.importPreviewUnchanged.replace("{{count}}", String(importPreview.unchanged)),
        c.importPreviewKept.replace("{{count}}", String(importPreview.keptExisting)),
      ].join("\n")
    : c.importConfirmDescription;

  return (
    <div className={`${portalPageShell()} portal-channels-page`}>
      <header className="portal-channels-header">
        <div>
          <h1 className={portalPageTitle(isLight)}>{c.title}</h1>
          <p className={portalPageSubtitle(isLight)}>{c.subtitle}</p>
        </div>
        <div className="portal-channels-actions">
          <button type="button" className="portal-channel-btn-secondary" onClick={() => void mgmt.reload()} disabled={mgmt.loading}>
            <RefreshCw size={16} />
            <span>{c.refresh}</span>
          </button>
          <label htmlFor={importInputId} className="portal-channel-btn-secondary portal-channel-file-label">
            <Upload size={16} />
            <span>{c.importJson}</span>
          </label>
          <input
            id={importInputId}
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="portal-channel-file-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void parseImportFile(file);
              e.target.value = "";
            }}
          />
          <button type="button" className="portal-channel-btn-secondary" onClick={() => void handleExport()} disabled={mgmt.saving}>
            <Download size={16} />
            <span>{c.exportJson}</span>
          </button>
          <button type="button" className="portal-channel-btn-primary" onClick={openCreate} disabled={mgmt.saving}>
            <Plus size={16} />
            <span>{c.newChannel}</span>
          </button>
        </div>
      </header>

      {toast ? <div className="portal-channel-toast">{toast}</div> : null}

      {mgmt.loading ? (
        <div className="portal-channel-state">{c.loading}</div>
      ) : mgmt.error ? (
        <div className="portal-channel-alert">
          {mgmt.error}
          <button type="button" className="portal-channel-link-btn" onClick={() => void mgmt.reload()}>
            {c.retry}
          </button>
        </div>
      ) : mgmt.channels.length === 0 ? (
        <div className="portal-channel-empty">
          <h2>{c.emptyTitle}</h2>
          <p>{c.emptyText}</p>
          <button type="button" className="portal-channel-btn-primary" onClick={openCreate}>
            {c.newChannel}
          </button>
        </div>
      ) : (
        <div className="portal-channels-grid">
          {mgmt.channels.map((channel) => (
            <article key={channel.id} className="portal-channel-card">
              <div className="portal-channel-card-head">
                <div>
                  <h2>{channel.name}</h2>
                  <p className="portal-channel-slug">{channel.slug}</p>
                </div>
                <label className="portal-channel-toggle">
                  <input
                    type="checkbox"
                    checked={channel.enabled}
                    disabled={mgmt.saving}
                    onChange={(e) => void mgmt.toggleEnabled(channel.id, e.target.checked)}
                  />
                  <span>{channel.enabled ? c.enabled : c.disabled}</span>
                </label>
              </div>
              <dl className="portal-channel-meta">
                <div>
                  <dt>{c.providerLabel}</dt>
                  <dd>{channel.providerType ?? channel.provider ?? "—"}</dd>
                </div>
                <div>
                  <dt>{c.modeLabel}</dt>
                  <dd>{channel.mode ?? "—"}</dd>
                </div>
                <div>
                  <dt>{c.storeLabel}</dt>
                  <dd>{channel.storeId ?? "—"}</dd>
                </div>
              </dl>
              <div className="portal-channel-card-actions">
                <button type="button" className="portal-channel-btn-secondary" onClick={() => openEdit(channel)}>
                  {c.edit}
                </button>
                <button
                  type="button"
                  className="portal-channel-btn-danger"
                  onClick={() => setDeleteTarget(channel)}
                  disabled={mgmt.saving}
                >
                  {c.delete}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ChannelFormDialog
        open={formOpen}
        title={editingId ? c.editChannel : c.newChannel}
        values={formValues}
        error={formError}
        busy={mgmt.saving}
        isLight={isLight}
        secretsUnavailableNotice={c.secretsUnavailable}
        testOrderLaterNotice={c.testOrderLater}
        labels={formLabels}
        onChange={setFormValues}
        onCancel={closeForm}
        onSave={() => void saveForm()}
      />

      <DeviceConfirmDialog
        open={deleteTarget != null}
        title={c.deleteTitle}
        description={c.deleteDescription.replace("{{name}}", deleteTarget?.name ?? "")}
        cancelLabel={c.cancel}
        confirmLabel={c.deleteConfirm}
        variant="destructive"
        busy={mgmt.saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          void mgmt.removeChannel(deleteTarget.id).then(() => {
            setDeleteTarget(null);
            showToast(c.toastDeleted);
          });
        }}
      />

      <DeviceConfirmDialog
        open={importConfirmOpen}
        title={c.importConfirmTitle}
        description={importConfirmDescription}
        notice={c.importConfirmNotice}
        cancelLabel={c.cancel}
        confirmLabel={c.importConfirmAction}
        variant="default"
        busy={mgmt.saving}
        onCancel={() => {
          if (mgmt.saving) return;
          setImportConfirmOpen(false);
          setPendingImport(null);
          setImportPreview(null);
        }}
        onConfirm={() => void confirmImport()}
      />
    </div>
  );
}
