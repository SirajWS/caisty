// apps/cloud-api/src/routes/webhooks.ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import { db } from "../db/client.js";
import { webhooks } from "../db/schema/webhooks.js";
import { payments } from "../db/schema/payments.js";
import { orgs } from "../db/schema/orgs.js";
import { notifications } from "../db/schema/notifications.js";
import { customers } from "../db/schema/customers.js";
import { and, eq } from "drizzle-orm";

type PaypalAmount = {
  value?: string;
  total?: string; // ältere Varianten
  currency_code?: string;
  currency?: string;
};

type PaypalResource = {
  id?: string; // z.B. Sale-ID
  sale_id?: string;
  invoice_id?: string;
  amount?: PaypalAmount;
  state?: string;
  status?: string;
};

type PaypalEvent = {
  id?: string;
  event_type?: string;
  resource?: PaypalResource;
  // Wir ignorieren den Rest, aber speichern ihn im payload
};

function mapPaypalStatus(eventType: string | undefined): "pending" | "paid" | "failed" {
  switch (eventType) {
    case "PAYMENT.SALE.COMPLETED":
      return "paid";
    case "PAYMENT.SALE.DENIED":
    case "PAYMENT.SALE.REFUNDED":
    case "PAYMENT.SALE.REVERSED":
      return "failed";
    default:
      return "pending";
  }
}

function toAmountCents(amount?: PaypalAmount): number | null {
  const raw = amount?.value ?? amount?.total;
  if (!raw) return null;
  const num = Number(raw.replace(",", "."));
  if (Number.isNaN(num)) return null;
  return Math.round(num * 100);
}

function formatAmount(amountCents: number, currency: string): string {
  const value = amountCents / 100;
  return `${value.toFixed(2)} ${currency}`;
}

// Platzhalter – echte Signaturprüfung kannst du später einbauen
function verifyPaypalSignature(_req: FastifyRequest, _body: PaypalEvent): boolean {
  // TODO: PAYPAL Webhook-Signatur verifizieren (SDK / REST-Aufruf)
  return true; // dev only
}

export async function registerWebhooksRoutes(app: FastifyInstance) {
  // ✅ Liste – benutzt deine Admin-UI
  app.get("/webhooks", async (request, reply) => {
    const items = await db.select().from(webhooks);

    return {
      items,
      total: items.length,
      limit: items.length,
      offset: 0,
    };
  });

  // 🟣 PayPal-Webhook-Eingang (öffentlich)
  app.post("/webhooks/paypal", async (request, reply) => {
    const body = request.body as PaypalEvent;

    if (!verifyPaypalSignature(request, body)) {
      // Wenn du später echte Prüfung einbaust, kannst du hier 400/401 zurückgeben
      request.log.warn("PayPal signature verification failed (stub)");
      reply.code(400);
      return reply.send({ ok: false, error: "invalid_signature" });
    }

    // 1) Org bestimmen – aktuell nehmen wir einfach die erste Org (Single-Tenant)
    const [org] = await db.select().from(orgs).limit(1);
    if (!org) {
      request.log.error("No org found while handling PayPal webhook");
      reply.code(500);
      return reply.send({ ok: false });
    }

    const eventType = body.event_type ?? "unknown";
    const resource = body.resource ?? {};
    const providerPaymentId =
      resource.id ?? resource.sale_id ?? resource.invoice_id ?? undefined;

    // 2) Erstmal das Webhook-Log mit Status "received" anlegen
    const [logRow] = await db
      .insert(webhooks)
      .values({
        orgId: org.id,
        provider: "paypal",
        eventType,
        status: "received",
        payload: body,
        errorMessage: null,
      })
      .returning();

    let webhookStatus: "received" | "processed" | "failed" = "received";
    let errorMessage: string | null = null;

    try {
      // 3) Optional: Payment updaten, wenn wir eins finden
      if (providerPaymentId) {
        const status = mapPaypalStatus(eventType);
        const amountCents = toAmountCents(resource.amount);
        const currency =
          resource.amount?.currency_code ?? resource.amount?.currency ?? "EUR";

        const existingPayments = await db
          .select()
          .from(payments)
          .where(
            and(
              eq(payments.provider, "paypal"),
              eq(payments.providerPaymentId, providerPaymentId),
            ),
          )
          .limit(1);

        if (existingPayments.length > 0) {
          const current = existingPayments[0];
          const oldStatus = current.status;

          await db
            .update(payments)
            .set({
              status,
              providerStatus: resource.state ?? resource.status ?? eventType,
              amountCents:
                amountCents !== null ? amountCents : current.amountCents,
              currency: currency || current.currency,
            })
            .where(eq(payments.id, current.id));

          // Notification für failed Payment
          if (status === "failed" && oldStatus !== "failed" && current.customerId) {
            // Customer-Info für Notification holen
            const [customer] = await db
              .select()
              .from(customers)
              .where(eq(customers.id, current.customerId))
              .limit(1);

            const customerName = customer
              ? customer.name || customer.email || current.customerId
              : current.customerId;

            await db.insert(notifications).values({
              orgId: current.orgId || org.id,
              type: "payment_failed",
              title: "Zahlung fehlgeschlagen",
              body: `Zahlung für ${customerName} ist fehlgeschlagen (${formatAmount(current.amountCents, current.currency)}).`,
              customerId: current.customerId,
              data: {
                paymentId: current.id,
                providerPaymentId: current.providerPaymentId,
                amountCents: current.amountCents,
                currency: current.currency,
                providerStatus: resource.state ?? resource.status ?? eventType,
              },
            });
          }
        } else {
          // Aktuell: Wenn kein Payment existiert, loggen wir nur das Webhook-Event.
          request.log.info(
            {
              providerPaymentId,
            },
            "PayPal webhook for unknown payment – logged only",
          );
        }
      } else {
        request.log.info(
          { eventType },
          "PayPal webhook without providerPaymentId – logged only",
        );
      }

      webhookStatus = "processed";
    } catch (err) {
      webhookStatus = "failed";
      errorMessage = err instanceof Error ? err.message : String(err);
      request.log.error({ err }, "Error while handling PayPal webhook");
    }

    // 4) Webhook-Log aktualisieren
    await db
      .update(webhooks)
      .set({
        status: webhookStatus,
        errorMessage,
      })
      .where(eq(webhooks.id, logRow.id));

    reply.code(200);
    return { ok: true };
  });
}
