// apps/cloud-api/src/routes/webhooks.ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import { db } from "../db/client.js";
import { webhooks } from "../db/schema/webhooks.js";
import { orgs } from "../db/schema/orgs.js";
import { eq, and } from "drizzle-orm";
import { billingService } from "../billing/billingServiceInstance.js";

// Platzhalter – echte Signaturprüfung kannst du später einbauen
function verifyPaypalSignature(_req: FastifyRequest, _body: any): boolean {
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
    // Fastify parses JSON automatically, but we need raw body for signature verification
    // For now, we'll use the parsed body and reconstruct the string
    const body = request.body as any;
    const bodyString = JSON.stringify(body);

    if (!verifyPaypalSignature(request, body)) {
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
    const eventId = body.id || body.event_id;

    // 2) Provider-Handler aufrufen
    const provider = billingService["providers"]["paypal"];
    const webhookResult = await provider.handleWebhook(
      bodyString,
      request.headers as Record<string, string | string[] | undefined>
    );

    // 3) Webhook idempotent speichern (event_id unique)
    let webhookRow;
    try {
      [webhookRow] = await db
        .insert(webhooks)
        .values({
          orgId: org.id,
          provider: "paypal",
          providerEnv: provider.env,
          eventId: eventId || null,
          eventType,
          status: webhookResult.status === "processed" ? "ok" : webhookResult.status === "failed" ? "failed" : "pending",
          payload: body,
          errorMessage: webhookResult.status === "failed" ? webhookResult.message : null,
          processedAt: webhookResult.status === "processed" ? new Date() : null,
        })
        .returning();
    } catch (err: any) {
      // Unique constraint violation = event already processed
      if (err.code === "23505") {
        request.log.info({ eventId }, "PayPal webhook event already processed, ignoring");
        reply.code(200);
        return { ok: true, message: "Event already processed" };
      }
      throw err;
    }

    // 4) Wenn processing fehlgeschlagen, loggen
    if (webhookResult.status === "failed" && webhookRow) {
      await db
        .update(webhooks)
        .set({
          status: "failed",
          errorMessage: webhookResult.message || "Unknown error",
        })
        .where(eq(webhooks.id, webhookRow.id));
    }

    reply.code(200);
    return { ok: true, status: webhookResult.status };
  });

  // 🔵 Stripe-Webhook-Eingang (öffentlich)
  app.post("/webhooks/stripe", async (request, reply) => {
    // Stripe benötigt raw body für Signature-Verifikation
    // Fastify parsed JSON automatisch, aber wir brauchen den raw body
    const body = request.body as any;
    const bodyString = JSON.stringify(body);

    // 1) Org bestimmen
    const [org] = await db.select().from(orgs).limit(1);
    if (!org) {
      request.log.error("No org found while handling Stripe webhook");
      reply.code(500);
      return reply.send({ ok: false });
    }

    const eventType = body.type || "unknown";
    const eventId = body.id;

    if (!eventId) {
      request.log.warn("Stripe webhook missing event ID");
      reply.code(400);
      return reply.send({ ok: false, error: "missing_event_id" });
    }

    // 2) Provider-Handler aufrufen
    const provider = billingService["providers"]["stripe"];
    const webhookResult = await provider.handleWebhook(
      bodyString,
      request.headers as Record<string, string | string[] | undefined>
    );

    // 3) Webhook idempotent speichern (event_id unique)
    let webhookRow;
    try {
      [webhookRow] = await db
        .insert(webhooks)
        .values({
          orgId: org.id,
          provider: "stripe",
          providerEnv: provider.env,
          eventId: eventId || null,
          eventType,
          status: webhookResult.status === "processed" ? "ok" : webhookResult.status === "failed" ? "failed" : "pending",
          payload: body,
          errorMessage: webhookResult.status === "failed" ? webhookResult.message : null,
          processedAt: webhookResult.status === "processed" ? new Date() : null,
        })
        .returning();
    } catch (err: any) {
      // Unique constraint violation = event already processed
      if (err.code === "23505") {
        request.log.info({ eventId }, "Stripe webhook event already processed, ignoring");
        reply.code(200);
        return { ok: true, message: "Event already processed" };
      }
      throw err;
    }

    // 4) Wenn processing fehlgeschlagen, loggen
    if (webhookResult.status === "failed" && webhookRow) {
      await db
        .update(webhooks)
        .set({
          status: "failed",
          errorMessage: webhookResult.message || "Unknown error",
        })
        .where(eq(webhooks.id, webhookRow.id));
    }

    reply.code(200);
    return { ok: true, status: webhookResult.status };
  });
}
