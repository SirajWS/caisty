import React from "react";
import { updatePortalAccount, type PortalCustomer } from "../../lib/portalApi";
import type { PortalTranslations } from "../../lib/translations/portal";
import { portalInputClass, portalPrimaryCta } from "../../lib/portalUi";

export function AccountProfileForm({
  customer,
  isLight,
  t,
  onUpdated,
}: {
  customer: PortalCustomer;
  isLight: boolean;
  t: PortalTranslations;
  onUpdated: (customer: PortalCustomer) => void;
}) {
  const a = t.account;
  const c = a.center;

  const [name, setName] = React.useState(customer.name);
  const [email, setEmail] = React.useState(customer.email);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    setName(customer.name);
    setEmail(customer.email);
  }, [customer.name, customer.email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      name.trim() === customer.name &&
      email.trim().toLowerCase() === customer.email.toLowerCase()
    ) {
      setSuccess(a.noChanges);
      return;
    }

    setSaving(true);
    try {
      const updated = await updatePortalAccount({
        name: name.trim(),
        email: email.trim(),
      });
      onUpdated(updated);
      setSuccess(a.updateSuccess);
    } catch (err) {
      setError(err instanceof Error ? err.message : a.updateError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dashboard-panel account-profile">
      <h2 className="dashboard-panel-title">{c.sectionProfile}</h2>

      {(error || success) && (
        <div
          className={`account-form-alert ${error ? "account-form-alert--error" : "account-form-alert--success"}`}
          role="status"
        >
          {error ?? success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="account-form">
        <div className="account-form-grid">
          <div className="account-form-field">
            <label className="account-form-label">{a.nameLabel}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={portalInputClass(isLight)}
              required
            />
          </div>
          <div className="account-form-field">
            <label className="account-form-label">{a.emailLabel}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={portalInputClass(isLight)}
              required
            />
          </div>
        </div>
        <div className="account-form-actions">
          <button type="submit" disabled={saving} className={`${portalPrimaryCta()} disabled:opacity-60`}>
            {saving ? a.saveBusy : a.save}
          </button>
        </div>
      </form>
    </section>
  );
}
