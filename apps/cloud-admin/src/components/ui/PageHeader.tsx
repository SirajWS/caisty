import type { ReactNode } from "react";

import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="ds-page-header">
      <div>
        <h1 className="ds-page-title">{title}</h1>
        {subtitle ? <p className="ds-page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ds-page-actions">{actions}</div> : null}
    </header>
  );
}
