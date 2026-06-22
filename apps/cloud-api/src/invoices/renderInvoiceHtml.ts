// apps/api/src/invoices/renderInvoiceHtml.ts

import type { InvoiceWithCustomerAndOrg } from "../services/invoiceService.js";
import { portalInvoiceDisplayBreakdown } from "../lib/portalInvoiceDisplayAmount.js";
import {
  billingPeriodLineItemSuffix,
  formatBillingPeriodLabel,
  formatPlanTierLabel,
  type BillingPeriod,
} from "../lib/billingPeriod.js";

const CAISTY_LOGO_SVG = `<svg width="48" height="48" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="0" y="0" width="256" height="256" rx="64" fill="#F97316"/>
  <path d="M172 88 C160 72 143 64 128 64 C99 64 76 87 76 116 C76 145 99 168 128 168 C143 168 160 160 172 144" fill="none" stroke="#ffffff" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function fmtCents(cents: number): string {
  return (Number(cents) / 100).toFixed(2);
}

export interface InvoiceHtmlRenderContext {
  subscriptionPlan?: string | null;
  subscriptionBillingPeriod?: BillingPeriod | null;
}

/**
 * Professionelles HTML-A4 Template für Invoice-Anzeige/Druck.
 * Optimiert für Druck und PDF-Export.
 */
export function renderInvoiceHtml(
  data: InvoiceWithCustomerAndOrg,
  context: InvoiceHtmlRenderContext = {},
): string {
  const { invoice, customer, org } = data;

  const breakdown =
    data.amountBreakdown ??
    portalInvoiceDisplayBreakdown(
      {
        status: invoice.status,
        amountCents: invoice.amountCents,
        amountGrossCents: invoice.amountGrossCents,
        amountNetCents: invoice.amountNetCents,
        amountTaxCents: invoice.amountTaxCents,
        planName: invoice.planName,
        currency: invoice.currency,
        billingPeriod: invoice.billingPeriod,
        provider: invoice.provider,
      },
      context.subscriptionPlan ?? null,
      context.subscriptionBillingPeriod ?? null,
    );

  const billingPeriod =
    (invoice.billingPeriod as BillingPeriod | null) ??
    context.subscriptionBillingPeriod ??
    breakdown.billingPeriod;
  const planTier =
    context.subscriptionPlan ??
    (invoice.planName ? invoice.planName.toLowerCase() : null);
  const planLabel = formatPlanTierLabel(planTier);
  const lineItemSuffix = billingPeriodLineItemSuffix(billingPeriod);
  const billingPeriodLabel = formatBillingPeriodLabel(billingPeriod, "de");

  const netStr = fmtCents(breakdown.netCents);
  const taxStr = fmtCents(breakdown.taxCents);
  const grossStr = fmtCents(breakdown.grossCents);
  const vatPct = Math.round(breakdown.vatRate * 100);
  const cur = invoice.currency ?? "EUR";
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
    overdue: "Überfällig",
  };
  const statusClass = `status-${String(invoice.status || "open").toLowerCase()}`;
  const detailSecondaryLabel = invoice.paidAt ? "Bezahlt am" : "Fällig am";
  const detailSecondaryDate = invoice.paidAt
    ? new Date(invoice.paidAt).toLocaleDateString("de-DE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : dueAt;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rechnung ${invoice.number}</title>
  <style>
    :root {
      --orange: #FF5B10;
      --orange-dark: #FF3F00;
      --text-dark: #15181D;
      --text-muted: #6B7280;
      --text-faint: #9AA1AC;
      --border: #E4E6EA;
      --card-bg: #F8F9FB;
      --total-bg: #FFF4ED;
      --total-border: #FFD9C2;
      --green: #16A34A;
      --green-bg: #E8F8EE;
    }
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    @media print {
      html,
      body {
        width: 100%;
        height: auto;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
      .invoice-sheet {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        min-height: 0 !important;
      }
      .top-accent {
        width: 100% !important;
        margin: 0 0 12px !important;
      }
      .header {
        flex-direction: row !important;
        align-items: center !important;
        margin-bottom: 16px !important;
        padding-bottom: 12px !important;
      }
      .invoice-meta {
        text-align: right !important;
        min-width: 180px !important;
      }
      .content {
        grid-template-columns: 1fr 1fr !important;
        gap: 20px !important;
        margin-bottom: 16px !important;
      }
      .meta-card {
        grid-template-columns: 1fr 1fr !important;
        margin-bottom: 16px !important;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .total-box {
        flex-direction: row !important;
        align-items: center !important;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .total-box-value {
        text-align: right !important;
        white-space: nowrap !important;
      }
      .footer {
        margin-top: 18px !important;
        padding-top: 10px !important;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .recurring-note {
        margin-top: 10px !important;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .items-table {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .items-table tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: var(--text-dark);
      background: #ffffff;
      margin: 0;
      padding: 0;
      line-height: 1.5;
    }
    .invoice-sheet {
      max-width: 210mm;
      margin: 0 auto;
      padding: 0 20mm 20mm;
      background: #fff;
    }
    .top-accent {
      height: 5px;
      width: calc(100% + 40mm);
      margin: 0 -20mm 18px;
      background: linear-gradient(90deg, var(--orange), var(--orange-dark));
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 22px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-text {
      line-height: 1.3;
    }
    .brand-text .logo-name {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-dark);
    }
    .brand-text .tagline {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 3px;
    }
    .invoice-meta {
      text-align: right;
      min-width: 220px;
    }
    .invoice-meta-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--text-faint);
      font-weight: 700;
      margin-bottom: 6px;
    }
    .invoice-meta-number {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 8px;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 11px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid transparent;
    }
    .status-badge::before {
      content: "";
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.9;
    }
    .status-paid {
      color: var(--green);
      background: var(--green-bg);
      border-color: rgba(22, 163, 74, 0.25);
    }
    .status-open {
      color: #b45309;
      background: #fff7ed;
      border-color: #fed7aa;
    }
    .status-overdue {
      color: #b91c1c;
      background: #fee2e2;
      border-color: #fecaca;
    }
    .status-canceled {
      color: #991b1b;
      background: #fee2e2;
      border-color: #fecaca;
    }
    .status-draft {
      color: #4b5563;
      background: #f3f4f6;
      border-color: #d1d5db;
    }
    .content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 26px;
      margin-bottom: 22px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--orange);
      margin-bottom: 10px;
    }
    .section-content {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.7;
    }
    .section-content strong {
      display: block;
      font-size: 17px;
      color: var(--text-dark);
      margin-bottom: 2px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 16px;
      margin-bottom: 8px;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      font-size: 12px;
      color: var(--text-muted);
    }
    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-dark);
      text-align: right;
    }
    .meta-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 22px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 16px;
    }
    .meta-item-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.13em;
      color: var(--text-faint);
      font-weight: 700;
      margin-bottom: 6px;
    }
    .meta-item-value {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-dark);
      line-height: 1.45;
      overflow-wrap: anywhere;
      word-break: break-all;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 16px;
    }
    .items-table thead {
      border-bottom: 1px solid var(--border);
    }
    .items-table th {
      text-align: left;
      padding: 10px 8px 10px 0;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.13em;
      color: var(--text-faint);
    }
    .items-table th:last-child,
    .items-table td:last-child {
      text-align: right;
      padding-right: 0;
    }
    .items-table td {
      padding: 11px 8px 11px 0;
      border-bottom: 1px solid #eef0f3;
      font-size: 14px;
      color: var(--text-dark);
      vertical-align: top;
    }
    .items-table .separator-top td {
      border-top: 2px solid var(--border);
      padding-top: 12px;
    }
    .items-table .total-row td {
      font-weight: 700;
      font-size: 15px;
    }
    .total-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
      margin-top: 8px;
      padding: 14px 16px;
      border-radius: 12px;
      background: var(--total-bg);
      border: 1px solid var(--total-border);
    }
    .total-box-label {
      font-size: 13px;
      color: #9a3412;
      font-weight: 600;
    }
    .total-box-value {
      font-size: 24px;
      font-weight: 800;
      color: var(--orange);
      letter-spacing: -0.02em;
      text-align: right;
      white-space: nowrap;
    }
    .recurring-note {
      margin-top: 14px;
      font-size: 12px;
      color: var(--text-muted);
      font-style: italic;
      line-height: 1.6;
    }
    .footer {
      margin-top: 34px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
      text-align: center;
    }
    .footer-org {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 4px;
    }
    .footer-links {
      font-size: 12px;
      color: var(--text-muted);
    }
    .footer-note {
      margin-top: 6px;
      font-size: 11px;
      color: var(--text-faint);
    }
    @media screen and (max-width: 900px) {
      .invoice-sheet {
        padding: 0 14mm 16mm;
      }
      .top-accent {
        width: calc(100% + 28mm);
        margin: 0 -14mm 14px;
      }
      .header {
        align-items: flex-start;
        flex-direction: column;
      }
      .invoice-meta {
        text-align: left;
        min-width: 0;
      }
      .content,
      .meta-card {
        grid-template-columns: 1fr;
      }
      .total-box {
        flex-direction: column;
        align-items: flex-start;
      }
      .total-box-value {
        text-align: left;
        white-space: normal;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-sheet">
    <div class="top-accent"></div>

    <div class="header">
      <div class="brand">
        ${CAISTY_LOGO_SVG}
        <div class="brand-text">
          <div class="logo-name">Caisty</div>
          <div class="tagline">POS & Cloud · www.caisty.com</div>
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-meta-label">Rechnung</div>
        <div class="invoice-meta-number">${invoice.number}</div>
        <span class="status-badge ${statusClass}">
          ${statusLabels[invoice.status] || invoice.status}
        </span>
      </div>
    </div>

    <div class="content">
      <div class="section">
        <div class="section-title">Rechnungsempfänger</div>
        <div class="section-content">
          <strong>${customer.name}</strong>
          ${customer.email}
        </div>
      </div>
      <div class="section">
        <div class="section-title">Rechnungsdetails</div>
        <div class="section-content">
          <div class="detail-row">
            <span class="detail-label">Ausgestellt am</span>
            <span class="detail-value">${issuedAt}</span>
          </div>
          ${detailSecondaryDate ? `<div class="detail-row"><span class="detail-label">${detailSecondaryLabel}</span><span class="detail-value">${detailSecondaryDate}</span></div>` : ""}
        </div>
      </div>
    </div>

    ${(invoice.planName || invoice.provider || invoice.paymentMethod || invoice.providerRef || billingPeriod) ? `
    <div class="meta-card">
      <div class="meta-item">
        <div class="meta-item-label">Plan</div>
        <div class="meta-item-value">${planLabel && planLabel !== "—" ? `Caisty ${planLabel}` : invoice.planName ? `Caisty ${invoice.planName}` : "—"}</div>
      </div>
      <div class="meta-item">
        <div class="meta-item-label">Abrechnungsintervall</div>
        <div class="meta-item-value">${billingPeriod ? billingPeriodLabel : "—"}</div>
      </div>
      <div class="meta-item">
        <div class="meta-item-label">Zahlungsart</div>
        <div class="meta-item-value">${invoice.paymentMethod ? (invoice.paymentMethod === "paypal" ? "PayPal" : invoice.paymentMethod === "card" ? "Kreditkarte (Visa/Mastercard)" : invoice.paymentMethod) : "—"}</div>
      </div>
      <div class="meta-item">
        <div class="meta-item-label">Transaktions-ID</div>
        <div class="meta-item-value">${invoice.providerRef || "—"}</div>
      </div>
    </div>
    ` : ""}

    <table class="items-table">
      <thead>
        <tr>
          <th>Beschreibung</th>
          <th>Betrag (netto)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${planLabel && planLabel !== "—" ? `Caisty ${planLabel} Lizenz` : invoice.planName ? `Caisty ${invoice.planName} Lizenz` : "Caisty POS Lizenz"} – ${lineItemSuffix}</td>
          <td>${netStr} ${cur}</td>
        </tr>
        <tr>
          <td>Umsatzsteuer (${vatPct} %)</td>
          <td>${taxStr} ${cur}</td>
        </tr>
        <tr class="separator-top total-row">
          <td>Gesamtbetrag (inkl. USt.)</td>
          <td>${grossStr} ${cur}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <div class="total-box-label">Zu zahlender Betrag (inkl. ${vatPct} % USt.)</div>
      <div class="total-box-value">${grossStr} ${cur}</div>
    </div>

    <div class="recurring-note">
      Dies ist ein wiederkehrendes Abonnement. Die nächste Abbuchung erfolgt gemäß dem gewählten Abrechnungsintervall, sofern das Abonnement nicht vorher gekündigt wird.
    </div>

    <div class="footer">
      <div class="footer-org">Caisty POS & Cloud</div>
      <div class="footer-links">www.caisty.com · info@caisty.com</div>
      <div class="footer-note">Diese Rechnung wurde automatisch erstellt.</div>
    </div>
  </div>
  
  <div class="no-print" style="display:none">
    ${org?.name ?? "Caisty"}
  </div>
</body>
</html>`;
}
