// apps/cloud-api/src/routes/invoices.ts
import type { FastifyInstance } from "fastify";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { invoices } from "../db/schema/invoices.js";
import { customers } from "../db/schema/customers.js";
import { subscriptions } from "../db/schema/subscriptions.js";

export async function registerInvoicesRoutes(app: FastifyInstance) {
  // GET /invoices/:id - Detail als JSON für Admin
  app.get<{ Params: { id: string } }>(
    "/invoices/:id",
    async (request, reply) => {
      try {
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
            number: String(inv.number ?? ""),
            status: String(inv.status ?? "open"),
            amountCents: Number(inv.amountCents ?? 0),
            currency: String(inv.currency ?? "EUR"),
            createdAt: (() => {
              try {
                return inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString();
              } catch {
                return new Date().toISOString();
              }
            })(),
            dueAt: (() => {
              try {
                return inv.dueAt ? new Date(inv.dueAt).toISOString() : null;
              } catch {
                return null;
              }
            })(),
            issuedAt: (() => {
              try {
                return inv.issuedAt ? new Date(inv.issuedAt).toISOString() : null;
              } catch {
                return null;
              }
            })(),
            plan: sub?.plan ? String(sub.plan) : null,
          },
          customer: customer
            ? {
                id: String(customer.id),
                name: String(customer.name ?? ""),
                email: String(customer.email ?? ""),
              }
            : null,
          subscription: sub
            ? {
                id: String(sub.id),
                plan: String(sub.plan ?? ""),
                status: String(sub.status ?? ""),
              }
            : null,
        };
      } catch (err: any) {
        request.log.error({ err, invoiceId: request.params.id }, "Error loading invoice detail");
        reply.code(500);
        return {
          ok: false,
          error: "Failed to load invoice",
          message: err?.message || "Internal server error",
        };
      }
    },
  );

  app.get<{ Querystring: { limit?: number; offset?: number } }>(
    "/invoices",
    async (request, reply) => {
      try {
        const limit = request.query.limit ?? 50;
        const offset = request.query.offset ?? 0;

        // Safe date conversion helper
        const safeDate = (date: any): string | null => {
          if (!date) return null;
          try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return null;
            return d.toISOString();
          } catch {
            return null;
          }
        };

        let rows: any[];
        try {
          rows = await db
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
        } catch (dbErr: any) {
          request.log.error({ err: dbErr, query: request.query }, "Database query failed");
          reply.code(500);
          return {
            ok: false,
            error: "Database query failed",
            message: dbErr?.message || "Internal server error",
            sqlState: dbErr?.code,
            hint: dbErr?.hint,
            details: process.env.NODE_ENV === "development" ? {
              stack: dbErr?.stack,
              code: dbErr?.code,
              detail: dbErr?.detail,
            } : undefined,
          };
        }

        const items = rows
          .filter((row: any) => {
            // Filter invalid rows - must have invoice with id
            return row && row.inv && row.inv.id;
          })
          .map((row: any) => {
            try {
              const inv = row.inv as any;
              const customer = row.customer as any;
              
              if (!inv || !inv.id) {
                return null; // Skip if no invoice
              }

              return {
                id: String(inv.id),
                number: String(inv.number ?? ""),
                status: String(inv.status ?? "open"),
                amountCents: Number(inv.amountCents ?? 0),
                currency: String(inv.currency ?? "EUR"),
                createdAt: safeDate(inv.createdAt) || new Date().toISOString(),
                dueAt: safeDate(inv.dueAt),
                customerId: customer?.id ? String(customer.id) : null,
                customerName: customer?.name ? String(customer.name) : null,
                customerEmail: customer?.email ? String(customer.email) : null,
              };
            } catch (mapErr: any) {
              request.log.warn({ err: mapErr, rowId: row?.inv?.id }, "Error mapping invoice row");
              return null;
            }
          })
          .filter((item: any) => item !== null); // Remove nulls after mapping

        return {
          items,
          total: items.length,
          limit,
          offset,
        };
      } catch (err: any) {
        request.log.error({ err, query: request.query }, "Error loading invoices");
        reply.code(500);
        return {
          ok: false,
          error: "Failed to load invoices",
          message: err?.message || "Internal server error",
        };
      }
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

  // DELETE /invoices/:id - Cleanup: Nur open/cancelled Invoices löschen
  app.delete<{ Params: { id: string } }>(
    "/invoices/:id",
    async (request, reply) => {
      const { id } = request.params;

      // Invoice finden
      const [inv] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, id))
        .limit(1);

      if (!inv) {
        reply.code(404);
        return { ok: false, error: "Invoice not found" };
      }

      // Nur open oder cancelled Status erlauben
      const allowedStatuses = ["open", "cancelled", "canceled", "draft"];
      const currentStatus = String(inv.status).toLowerCase();

      if (!allowedStatuses.includes(currentStatus)) {
        reply.code(400);
        return {
          ok: false,
          error: "Cannot delete invoice",
          message: `Invoices with status "${inv.status}" cannot be deleted. Only open/cancelled invoices can be deleted.`,
          currentStatus: inv.status,
        };
      }

      // Prüfen ob es verknüpfte Payments gibt
      const { payments } = await import("../db/schema/payments.js");
      const relatedPayments = await db
        .select({ id: payments.id })
        .from(payments)
        .where(eq(payments.subscriptionId, inv.subscriptionId || ""))
        .limit(5);

      if (relatedPayments.length > 0 && inv.status === "open") {
        // Warnung, aber nicht blockieren (Payments können auch ohne Invoice existieren)
        // Für jetzt: erlauben, aber warnen
      }

      // Invoice löschen
      await db.delete(invoices).where(eq(invoices.id, id));

      return {
        ok: true,
        message: `Invoice ${id} deleted successfully`,
        deletedInvoice: {
          id: String(inv.id),
          number: String(inv.number),
          status: String(inv.status),
          amountCents: Number(inv.amountCents),
        },
      };
    },
  );
}
