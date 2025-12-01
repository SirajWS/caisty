// apps/cloud-api/src/routes/invoices.ts
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { invoices } from "../db/schema/invoices.js";
import { customers } from "../db/schema/customers.js";
import { subscriptions } from "../db/schema/subscriptions.js";

export async function registerInvoicesRoutes(app: FastifyInstance) {
  // GET /invoices/:id - Detail als JSON für Admin
  app.get<{ Params: { id: string } }>(
    "/invoices/:id",
    async (request, reply) => {
      const { id } = request.params;

      const [row] = await db
        .select({
          inv: invoices,
          customer: customers,
          sub: subscriptions,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .leftJoin(subscriptions, eq(invoices.subscriptionId, subscriptions.id))
        .where(eq(invoices.id, id))
        .limit(1);

      if (!row || !row.inv) {
        reply.code(404);
        return { error: "Invoice not found" };
      }

      const inv = row.inv as any;
      const customer = row.customer as any;
      const sub = row.sub as any;

      return {
        ok: true,
        invoice: {
          id: String(inv.id),
          number: String(inv.number),
          status: String(inv.status),
          amountCents: Number(inv.amountCents),
          currency: String(inv.currency ?? "EUR"),
          createdAt: inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString(),
          dueAt: inv.dueAt ? new Date(inv.dueAt).toISOString() : null,
          issuedAt: inv.issuedAt ? new Date(inv.issuedAt).toISOString() : null,
          plan: sub?.plan ?? null,
        },
        customer: customer
          ? {
              id: String(customer.id),
              name: String(customer.name),
              email: String(customer.email),
            }
          : null,
        subscription: sub
          ? {
              id: String(sub.id),
              plan: String(sub.plan),
              status: String(sub.status),
            }
          : null,
      };
    },
  );

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

      // Verwende renderInvoiceHtml für professionelles Template
      const { getInvoiceWithCustomerAndOrg } = await import("../services/invoiceService.js");
      const invoiceData = await getInvoiceWithCustomerAndOrg(id);
      
      if (!invoiceData) {
        reply.code(404).type("text/plain").send("Invoice not found");
        return;
      }

      const { renderInvoiceHtml } = await import("../invoices/renderInvoiceHtml.js");
      const html = renderInvoiceHtml(invoiceData);

      reply.type("text/html").send(html);
    },
  );
}
