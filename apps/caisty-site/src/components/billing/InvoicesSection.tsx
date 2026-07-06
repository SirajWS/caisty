import type { PortalInvoice } from "../../lib/portalApi";
import type { PortalTranslations } from "../../lib/translations/portal";
import { InvoicesTable } from "./InvoicesTable";

export function InvoicesSection({
  items,
  loading,
  error,
  isLight,
  locale,
  t,
  title,
}: {
  items: PortalInvoice[];
  loading: boolean;
  error: string | null;
  isLight: boolean;
  locale: string;
  t: PortalTranslations;
  title: string;
}) {
  return (
    <section id="billing-invoices" className="dashboard-panel scroll-mt-20">
      <h2 className="dashboard-panel-title">{title}</h2>
      <p className="dashboard-text-muted text-xs mt-0 mb-3">{t.invoices.subtitle}</p>
      <InvoicesTable
        items={items}
        loading={loading}
        error={error}
        isLight={isLight}
        locale={locale}
        t={t}
      />
    </section>
  );
}
