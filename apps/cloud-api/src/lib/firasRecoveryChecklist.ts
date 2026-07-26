/**
 * Dry-run helper script for Stripe paid-invoice reconciliation.
 *
 * Usage (after admin JWT / or via HTTP):
 *   Prefer HTTP:
 *     POST /admin/billing/reconcile-stripe-invoice
 *     Authorization: Bearer <admin-jwt>
 *     { "stripeInvoiceId": "in_...", "dryRun": true }
 *
 * Do NOT run with dryRun:false until explicitly approved.
 *
 * For Firas / Bloom Cafe July 2026 renewal, obtain from Stripe Dashboard (Live):
 *   - Invoice ID starting with in_ for the 21.07.2026 €14.99 charge
 *   - Confirm subscription id sub_... and customer cus_...
 */

export const FIRAS_RECOVERY_CHECKLIST = {
  email: "firas.bettaieb92@gmail.com",
  company: "Bloom Cafe",
  expectedAmountCents: 1499,
  expectedCurrency: "EUR",
  junePaymentApprox: "2026-06-21",
  julyPaymentApprox: "2026-07-21",
  requiredStripeInvoiceIdPrefix: "in_",
  adminEndpoint: "POST /admin/billing/reconcile-stripe-invoice",
  dryRunBody: {
    stripeInvoiceId: "in_REPLACE_WITH_JULY_INVOICE_ID",
    dryRun: true,
  },
  executeBody: {
    stripeInvoiceId: "in_REPLACE_WITH_JULY_INVOICE_ID",
    dryRun: false,
  },
  expectDryRun: {
    localInvoiceExists: false,
    localPaymentExists: false,
    blockers: [],
    manualLicensesUntouched: true,
  },
} as const;
