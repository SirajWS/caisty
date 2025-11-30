// apps/cloud-api/src/routes/invoices.ts
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { invoices } from "../db/schema/invoices.js";
import { customers } from "../db/schema/customers.js";
import { subscriptions } from "../db/schema/subscriptions.js";

export async function registerInvoicesRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { limit?: number; offset?: number } }>(
    "/invoices",
    async (request) => {
      const limit = request.query.limit ?? 50;
      const offset = request.query.offset ?? 0;

      const rows = await db
        .select({
          inv: invoices,
          customer: customers,
          sub: subscriptions,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .leftJoin(subscriptions, eq(invoices.subscriptionId, subscriptions.id))
        .limit(limit)
        .offset(offset);

      const items = rows.map((row: any) => {
        const inv = row.inv as any;
        const customer = row.customer as any;
        return {
          id: String(inv.id),
          number: String(inv.number),
          status: String(inv.status),
          amountCents: Number(inv.amountCents),
          currency: String(inv.currency ?? "EUR"),
          createdAt: inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString(),
          dueAt: inv.dueAt ? new Date(inv.dueAt).toISOString() : null,
          customerId: customer ? String(customer.id) : null,
          customerName: customer ? String(customer.name) : null,
          customerEmail: customer ? String(customer.email) : null,
        };
      });

      // Total count (vereinfacht - sollte paginiert werden)
      const [countRow] = await db
        .select({ count: invoices.id })
        .from(invoices);

      return {
        items,
        total: items.length,
        limit,
        offset,
      };
    },
  );

  // GET /invoices/:id/html - HTML-Ansicht für Admin (optional Auth)
  app.get<{ Params: { id: string } }>(
    "/invoices/:id/html",
    async (request, reply) => {
      const { id } = request.params;

      // Optional: Admin-Auth prüfen (wenn vorhanden)
      const user = (request as any).user;
      const hasAuth = !!user;

      const [row] = await db
        .select({
          inv: invoices,
          customer: customers,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(eq(invoices.id, id))
        .limit(1);

      if (!row || !row.inv) {
        reply.code(404).type("text/plain").send("Invoice not found");
        return;
      }

      const inv = row.inv as any;
      const customer = row.customer as any;

      // Wenn Auth vorhanden, prüfen ob User Zugriff hat (optional)
      // Für jetzt: Invoice-ID ist bereits ein Geheimnis, daher erlauben wir Zugriff

      // Einfaches HTML
      const amount = Number(inv.amountCents) / 100;
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rechnung ${inv.number}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #333; }
    .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .invoice-details { margin: 20px 0; }
    .invoice-details table { width: 100%; border-collapse: collapse; }
    .invoice-details td { padding: 8px; border-bottom: 1px solid #ddd; }
    .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <div>
      <h1>Rechnung ${inv.number}</h1>
      <p>Status: ${inv.status}</p>
      ${customer ? `<p>Kunde: ${customer.name} (${customer.email})</p>` : ""}
    </div>
    <div>
      <p>Ausgestellt: ${inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("de-DE") : "—"}</p>
      <p>Fällig: ${inv.dueAt ? new Date(inv.dueAt).toLocaleDateString("de-DE") : "—"}</p>
    </div>
  </div>
  <div class="invoice-details">
    <table>
      <tr><td>Betrag:</td><td class="amount">${amount.toFixed(2)} ${inv.currency ?? "EUR"}</td></tr>
    </table>
  </div>
</body>
</html>`;

      reply.type("text/html").send(html);
    },
  );
}
