// apps/api/src/invoices/renderInvoice.ts

import type { InvoiceWithCustomerAndOrg } from "../services/invoiceService";

/**
 * Sehr simples HTML-A4 Template für Invoice-Anzeige/Druck.
 * Später kann man hier Styles / Logo / Tabellen-Layout pimpen.
 */
export function renderInvoiceHtml(
  data: InvoiceWithCustomerAndOrg,
): string {
  const { invoice, customer, org } = data;

  const amount = (Number(invoice.amountCents) / 100).toFixed(2);
  const createdAt = new Date(invoice.createdAt).toLocaleString("de-DE");
  const periodStart = invoice.periodStart
    ? new Date(invoice.periodStart).toLocaleDateString("de-DE")
    : "—";
  const periodEnd = invoice.periodEnd
    ? new Date(invoice.periodEnd).toLocaleDateString("de-DE")
    : "—";

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>Rechnung ${invoice.number}</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 40px; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .meta { margin-bottom: 24px; }
    .meta div { margin-bottom: 4px; }
    .section-title { font-weight: 600; margin-top: 24px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
    .right { text-align: right; }
    .total-row td { font-weight: 600; }
    .footer { margin-top: 40px; font-size: 12px; color: #555; }
  </style>
</head>
<body>
  <h1>Rechnung ${invoice.number}</h1>
  <div class="meta">
    <div>Ausgestellt am: ${createdAt}</div>
    <div>Status: ${invoice.status}</div>
    <div>Zeitraum: ${periodStart} – ${periodEnd}</div>
  </div>

  <div class="section-title">Rechnungsempfänger</div>
  <div>${customer.name}</div>
  <div>${customer.email}</div>
  ${
    invoice.billingName || invoice.billingAddress
      ? `<div>${invoice.billingName ?? ""}</div><div>${invoice.billingAddress ?? ""}</div>`
      : ""
  }

  <div class="section-title">Leistung</div>
  <table>
    <thead>
      <tr>
        <th>Beschreibung</th>
        <th class="right">Betrag</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${invoice.description ?? invoice.plan ?? "Caisty POS Lizenz"}</td>
        <td class="right">${amount} €</td>
      </tr>
      <tr class="total-row">
        <td>Gesamt</td>
        <td class="right">${amount} €</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    ${
      org?.name
        ? `${org.name} – ${org.address ?? ""}`
        : "Caisty – POS & Cloud"
    }<br />
    Diese Rechnung wurde automatisch erstellt.
  </div>
</body>
</html>`;
}
