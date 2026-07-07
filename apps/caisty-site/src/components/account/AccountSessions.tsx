import type { AccountField } from "../../lib/account/types";
import { AccountInfoGrid } from "./AccountInfoGrid";

export function AccountSessions({
  fields,
  title,
  logoutLabel,
  comingSoonLabel,
}: {
  fields: AccountField[];
  title: string;
  logoutLabel: string;
  comingSoonLabel: string;
}) {
  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{title}</h2>
      <AccountInfoGrid fields={fields} />
      <div className="account-form-actions mt-3">
        <span className="dashboard-quick-btn dashboard-quick-btn--disabled" aria-disabled>
          {logoutLabel}
          <span className="dashboard-quick-badge">{comingSoonLabel}</span>
        </span>
      </div>
    </section>
  );
}
