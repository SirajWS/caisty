// apps/api/src/routes/portal/invoices.ts

import type { FastifyInstance, FastifyRequest } from "fastify";
import { getInvoiceWithCustomerAndOrg } from "../../services/invoiceService";
import { renderInvoiceHtml } from "../../invoices/renderInvoice";
import { requirePortalAuth } from "../portal/_auth"; // ggf. anpassen

type InvoiceParams = {
  id: string;
};

export async function registerPortalInvoiceRoutes(app: FastifyInstance) {
  // Detail als JSON (für React-Detailseite)
  app.get(
    "/portal/invoices/:id",
    {
      preHandler: [requirePortalAuth],
    },
    async (request: FastifyRequest<{ Params: InvoiceParams }>, reply) => {
      const { id } = request.params;
      const auth = (request as any).portalAuth; // aus deinem Auth-Middleware

      const data = await getInvoiceWithCustomerAndOrg(id);
      if (!data) {
        return reply.code(404).send({ ok: false, message: "Invoice not found" });
      }

      // Sicherstellen, dass Invoice zum eingeloggten Customer gehört
      if (data.customer.id !== auth.customerId) {
        return reply.code(403).send({ ok: false, message: "Forbidden" });
      }

      const { invoice, customer, org } = data;

      const amount = Number(invoice.amountCents) / 100;

      return reply.send({
        ok: true,
        invoice: {
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          amountCents: invoice.amountCents,
          amount,
          currency: invoice.currency,
          createdAt: invoice.createdAt,
          dueAt: invoice.dueAt,
          periodStart: invoice.periodStart,
          periodEnd: invoice.periodEnd,
          plan: invoice.plan,
        },
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
        org: org
          ? {
              id: org.id,
              name: org.name,
              address: org.address,
              vatId: org.vatId,
            }
          : null,
      });
    },
  );

  // HTML-Ansicht zum Anzeigen/Drucken
  app.get(
    "/portal/invoices/:id/html",
    {
      preHandler: [requirePortalAuth],
    },
    async (request: FastifyRequest<{ Params: InvoiceParams }>, reply) => {
      const { id } = request.params;
      const auth = (request as any).portalAuth;

      const data = await getInvoiceWithCustomerAndOrg(id);
      if (!data) {
        return reply.code(404).type("text/plain").send("Invoice not found");
      }
      if (data.customer.id !== auth.customerId) {
        return reply.code(403).type("text/plain").send("Forbidden");
      }

      const html = renderInvoiceHtml(data);
      reply.type("text/html").send(html);
    },
  );
}
