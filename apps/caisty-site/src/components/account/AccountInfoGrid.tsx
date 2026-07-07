import type { AccountField } from "../../lib/account/types";

export function AccountInfoGrid({ fields }: { fields: AccountField[] }) {
  return (
    <dl className="account-info-grid">
      {fields.map((row) => (
        <div key={row.id} className="account-info-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
