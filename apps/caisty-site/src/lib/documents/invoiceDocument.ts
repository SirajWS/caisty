/**
 * Reserved for portal invoice PDF exports.
 *
 * HTML rendering today lives in cloud-api:
 * `apps/cloud-api/src/invoices/renderInvoiceHtml.ts`
 *
 * When invoices move into the shared document stack, reuse
 * `CAISTY_DOCUMENT_BRAND` from `./branding` and `CaistyPdfDocument`
 * from `./baseDocument`.
 */
export type InvoiceDocumentPlaceholder = never;
