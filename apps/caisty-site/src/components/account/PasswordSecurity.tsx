import React from "react";
import { changePortalPassword } from "../../lib/portalApi";
import type { PortalTranslations } from "../../lib/translations/portal";
import { portalInputClass } from "../../lib/portalUi";

export function PasswordSecurity({
  isLight,
  t,
}: {
  isLight: boolean;
  t: PortalTranslations;
}) {
  const a = t.account;
  const c = a.center;

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [newPasswordRepeat, setNewPasswordRepeat] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword) {
      setError(a.fillAllFields);
      return;
    }
    if (newPassword.length < 6) {
      setError(a.passwordTooShort);
      return;
    }
    if (newPassword !== newPasswordRepeat) {
      setError(a.passwordMismatch);
      return;
    }

    setSaving(true);
    try {
      await changePortalPassword({ currentPassword, newPassword });
      setSuccess(a.passwordSuccess);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordRepeat("");
    } catch (err) {
      setError(err instanceof Error ? err.message : a.passwordError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{c.sectionPassword}</h2>

      {(error || success) && (
        <div
          className={`account-form-alert ${error ? "account-form-alert--error" : "account-form-alert--success"}`}
          role="status"
        >
          {error ?? success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="account-form">
        <div className="account-form-stack">
          <div className="account-form-field">
            <label className="account-form-label">{a.currentPassword}</label>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={portalInputClass(isLight)}
            />
          </div>
          <div className="account-form-field">
            <label className="account-form-label">{a.newPassword}</label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={portalInputClass(isLight)}
            />
          </div>
          <div className="account-form-field">
            <label className="account-form-label">{a.repeatPassword}</label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPasswordRepeat}
              onChange={(e) => setNewPasswordRepeat(e.target.value)}
              className={portalInputClass(isLight)}
            />
          </div>
        </div>
        <div className="account-form-actions">
          <button
            type="submit"
            disabled={saving}
            className={`account-secondary-btn ${isLight ? "account-secondary-btn--light" : ""} disabled:opacity-60`}
          >
            {saving ? a.passwordBusy : a.passwordSubmit}
          </button>
        </div>
      </form>
    </section>
  );
}
