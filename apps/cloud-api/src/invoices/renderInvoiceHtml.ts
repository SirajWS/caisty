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
      border-bottom: 2px solid #f97316;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-text .logo-name {
      font-size: 24px;
      font-weight: 700;
      color: #f97316;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }
    .brand-text .tagline {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }
    .brand-text .company-links {
      font-size: 11px;
      color: #666;
      margin-top: 6px;
    }
    .brand-text .company-links a {
      color: #f97316;
      text-decoration: none;
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
      border-top: 2px solid #f97316;
    }
    .total-amount-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }
    .total-amount-value {
      font-size: 32px;
      font-weight: 700;
      color: #0b1220;
    }
    .recurring-note {
      margin-top: 28px;
      padding: 14px 16px;
      background: #f9fafb;
      border-left: 3px solid #f97316;
      font-size: 12px;
      color: #555;
      line-height: 1.6;
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
    <div class="brand">
      ${CAISTY_LOGO_SVG}
      <div class="brand-text">
        <div class="logo-name">Caisty</div>
        <div class="tagline">POS & Cloud</div>
        <div class="company-links">
          <a href="https://www.caisty.com">www.caisty.com</a> ·
          <a href="mailto:info@caisty.com">info@caisty.com</a>
        </div>
      </div>
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
          ${invoice.status !== "paid" && dueAt ? `<div style="margin-bottom: 8px;"><strong>Fällig am:</strong> ${dueAt}</div>` : ""}
          ${invoice.paidAt ? `<div style="margin-bottom: 8px;"><strong>Bezahlt am:</strong> ${new Date(invoice.paidAt).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}</div>` : ""}
        </div>
      </div>
      ${invoice.planName || invoice.provider || invoice.paymentMethod || invoice.providerRef || billingPeriod ? `
      <div class="section" style="margin-top: 20px;">
        <div class="section-title">Zahlungsinformationen</div>
        <div class="section-content" style="margin-top: 12px;">
          ${planLabel && planLabel !== "—" ? `<div style="margin-bottom: 8px;"><strong>Plan:</strong> Caisty ${planLabel}</div>` : invoice.planName ? `<div style="margin-bottom: 8px;"><strong>Plan:</strong> Caisty ${invoice.planName}</div>` : ""}
          ${billingPeriod ? `<div style="margin-bottom: 8px;"><strong>Abrechnungsintervall:</strong> ${billingPeriodLabel}</div>` : ""}
          ${invoice.paymentMethod ? `<div style="margin-bottom: 8px;"><strong>Zahlungsart:</strong> ${invoice.paymentMethod === "paypal" ? "PayPal" : invoice.paymentMethod === "card" ? "Kreditkarte (Visa/Mastercard)" : invoice.paymentMethod}</div>` : ""}
          ${invoice.providerRef ? `<div style="margin-bottom: 8px;"><strong>Transaktions-ID:</strong> <code style="font-size: 11px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${invoice.providerRef}</code></div>` : ""}
        </div>
      </div>
      ` : ""}
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Beschreibung</th>
        <th class="text-right">Betrag (netto)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${planLabel && planLabel !== "—" ? `Caisty ${planLabel} Lizenz` : invoice.planName ? `Caisty ${invoice.planName} Lizenz` : "Caisty POS Lizenz"} – ${lineItemSuffix}</td>
        <td class="text-right">${netStr} ${cur}</td>
      </tr>
      <tr>
        <td>Umsatzsteuer (${vatPct} %)</td>
        <td class="text-right">${taxStr} ${cur}</td>
      </tr>
      <tr class="total-row">
        <td>Gesamtbetrag (inkl. USt.)</td>
        <td class="text-right">${grossStr} ${cur}</td>
      </tr>
    </tbody>
  </table>

  <div class="total-amount">
    <div class="total-amount-label">Zu zahlender Betrag (inkl. ${vatPct} % USt.)</div>
    <div class="total-amount-value">${grossStr} ${cur}</div>
  </div>

  <div class="recurring-note">
    Dies ist ein wiederkehrendes Abonnement. Die nächste Abbuchung erfolgt gemäß dem gewählten Abrechnungsintervall, sofern das Abonnement nicht vorher gekündigt wird.
  </div>

  <div class="footer">
    <div class="footer-org">
      ${org?.name ?? "Caisty"}
    </div>
    <div>www.caisty.com · info@caisty.com</div>
    <div style="margin-top: 8px;">
      Diese Rechnung wurde automatisch erstellt.
    </div>
  </div>
</body>
</html>`;
}
