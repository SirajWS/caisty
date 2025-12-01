// apps/api/src/invoices/renderInvoice.ts

import type { InvoiceWithCustomerAndOrg } from "../services/invoiceService.js";

/**
 * Professionelles HTML-A4 Template für Invoice-Anzeige/Druck.
 * Optimiert für Druck und PDF-Export.
 */
export function renderInvoiceHtml(
  data: InvoiceWithCustomerAndOrg,
): string {
  const { invoice, customer, org } = data;

  const amount = (Number(invoice.amountCents) / 100).toFixed(2);
  const issuedAt = invoice.issuedAt
    ? new Date(invoice.issuedAt).toLocaleDateString("de-DE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date(invoice.createdAt).toLocaleDateString("de-DE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  const dueAt = invoice.dueAt
    ? new Date(invoice.dueAt).toLocaleDateString("de-DE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const statusLabels: Record<string, string> = {
    open: "Offen",
    paid: "Bezahlt",
    canceled: "Storniert",
    draft: "Entwurf",
  };

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rechnung ${invoice.number}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      color: #1a1a1a;
      line-height: 1.6;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #22c55e;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #22c55e;
      letter-spacing: -0.5px;
    }
    .invoice-meta {
      text-align: right;
      font-size: 14px;
      color: #666;
    }
    .invoice-meta strong {
      display: block;
      font-size: 18px;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }
    .status-open { background: #fef3c7; color: #92400e; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-canceled { background: #fee2e2; color: #991b1b; }
    .status-draft { background: #e5e7eb; color: #374151; }
    .content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      margin-bottom: 12px;
    }
    .section-content {
      font-size: 14px;
      line-height: 1.8;
    }
    .section-content strong {
      display: block;
      font-size: 16px;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .items-table thead {
      background: #f9fafb;
      border-bottom: 2px solid #e5e7eb;
    }
    .items-table th {
      text-align: left;
      padding: 12px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .items-table .text-right {
      text-align: right;
    }
    .items-table .total-row {
      background: #f9fafb;
      font-weight: 700;
      font-size: 16px;
      border-top: 2px solid #e5e7eb;
    }
    .total-amount {
      text-align: right;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #22c55e;
    }
    .total-amount-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }
    .total-amount-value {
      font-size: 32px;
      font-weight: 700;
      color: #22c55e;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .footer-org {
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Caisty</div>
      <div style="font-size: 12px; color: #666; margin-top: 4px;">POS & Cloud</div>
    </div>
    <div class="invoice-meta">
      <strong>Rechnung</strong>
      ${invoice.number}
      <div style="margin-top: 8px;">
        <span class="status-badge status-${invoice.status}">
          ${statusLabels[invoice.status] || invoice.status}
        </span>
      </div>
    </div>
  </div>

  <div class="content">
    <div>
      <div class="section">
        <div class="section-title">Rechnungsempfänger</div>
        <div class="section-content">
          <strong>${customer.name}</strong>
          ${customer.email}
        </div>
      </div>
    </div>
    <div>
      <div class="section">
        <div class="section-title">Rechnungsdetails</div>
        <div class="section-content">
          <div style="margin-bottom: 8px;">
            <strong>Ausgestellt am:</strong> ${issuedAt}
          </div>
          ${dueAt ? `<div><strong>Fällig am:</strong> ${dueAt}</div>` : ""}
        </div>
      </div>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Beschreibung</th>
        <th class="text-right">Betrag</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Caisty POS Lizenz – Monatliche Abrechnung</td>
        <td class="text-right">${amount} ${invoice.currency ?? "EUR"}</td>
      </tr>
      <tr class="total-row">
        <td>Gesamtbetrag</td>
        <td class="text-right">${amount} ${invoice.currency ?? "EUR"}</td>
      </tr>
    </tbody>
  </table>

  <div class="total-amount">
    <div class="total-amount-label">Zu zahlender Betrag</div>
    <div class="total-amount-value">${amount} ${invoice.currency ?? "EUR"}</div>
  </div>

  <div class="footer">
    <div class="footer-org">
      ${org?.name ?? "Caisty – POS & Cloud"}
    </div>
    <div>Diese Rechnung wurde automatisch erstellt.</div>
    <div style="margin-top: 8px;">
      Bei Fragen wenden Sie sich bitte an support@caisty.com
    </div>
  </div>
</body>
</html>`;
}
