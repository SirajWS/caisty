import React from "react";
import { createPortalSupportMessage } from "../../lib/portalApi";
import type { PortalTranslations } from "../../lib/translations/portal";
import { portalInputClass, portalPrimaryCta } from "../../lib/portalUi";

export function SupportRequestForm({
  isLight,
  t,
  onSubmitted,
}: {
  isLight: boolean;
  t: PortalTranslations;
  onSubmitted: () => void;
}) {
  const s = t.support;
  const c = s.center;

  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!subject.trim() || !message.trim()) {
      setError(s.validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await createPortalSupportMessage({
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccess(s.successMessage);
      setSubject("");
      setMessage("");
      onSubmitted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : s.sendError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="support-request-form" className="dashboard-panel scroll-mt-20">
      <h2 className="dashboard-panel-title">{c.sectionNewRequest}</h2>
      <p className="dashboard-text-muted text-xs mt-0 mb-3">{s.subtitle}</p>

      {(error || success) && (
        <div
          className={`support-form-alert ${error ? "support-form-alert--error" : "support-form-alert--success"}`}
          role="status"
        >
          {error ?? success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="support-form">
        <div className="support-form-stack">
          <div className="support-form-field">
            <label className="support-form-label">{s.subjectLabel}</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={s.subjectPlaceholder}
              className={portalInputClass(isLight)}
            />
          </div>
          <div className="support-form-field">
            <label className="support-form-label">{s.messageLabel}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder={s.messagePlaceholder}
              className={`min-h-[8rem] resize-y ${portalInputClass(isLight)}`}
            />
          </div>
        </div>
        <div className="support-form-actions">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${portalPrimaryCta()} disabled:opacity-60`}
          >
            {isSubmitting ? s.submitting : s.send}
          </button>
        </div>
      </form>
    </section>
  );
}
