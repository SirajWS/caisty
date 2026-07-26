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

function rawBodyFromRequest(request: FastifyRequest): string {
  const raw = (request as any).rawBody;
  if (typeof raw === "string" && raw.length > 0) return raw;
  // Fallback (breaks Stripe signature verify — only for non-Stripe paths)
  return JSON.stringify(request.body ?? {});
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
    const body = request.body as any;
    const bodyString = rawBodyFromRequest(request);

    if (!verifyPaypalSignature(request, body)) {
      request.log.warn("PayPal signature verification failed (stub)");
      reply.code(400);
      return reply.send({ ok: false, error: "invalid_signature" });
    }

    const [org] = await db.select().from(orgs).limit(1);
    if (!org) {
      request.log.error("No org found while handling PayPal webhook");
      reply.code(500);
      return reply.send({ ok: false });
    }

    const eventType = body.event_type ?? "unknown";
    const eventId = body.id || body.event_id;

    const provider = billingService["providers"]["paypal"];
    const webhookResult = await provider.handleWebhook(
      bodyString,
      request.headers as Record<string, string | string[] | undefined>
    );

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
          status:
            webhookResult.status === "processed"
              ? "ok"
              : webhookResult.status === "failed"
                ? "failed"
                : "pending",
          payload: body,
          errorMessage:
            webhookResult.status === "failed" ? webhookResult.message : null,
          processedAt:
            webhookResult.status === "processed" ? new Date() : null,
        })
        .returning();
    } catch (err: any) {
      if (err.code === "23505") {
        request.log.info({ eventId }, "PayPal webhook event already processed, ignoring");
        reply.code(200);
        return { ok: true, message: "Event already processed" };
      }
      throw err;
    }

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
    const body = request.body as any;
    const bodyString = rawBodyFromRequest(request);

    const [org] = await db.select().from(orgs).limit(1);
    if (!org) {
      request.log.error("No org found while handling Stripe webhook");
      reply.code(500);
      return reply.send({ ok: false });
    }

    const eventType = body?.type || "unknown";
    const eventId = body?.id;

    if (!eventId) {
      request.log.warn("Stripe webhook missing event ID");
      reply.code(400);
      return reply.send({ ok: false, error: "missing_event_id" });
    }

    const provider = billingService["providers"]["stripe"];

    // 1) Persist as pending first — business failure must not look like success
    let webhookRow: { id: string; status: string } | undefined;
    try {
      const [inserted] = await db
        .insert(webhooks)
        .values({
          orgId: org.id,
          provider: "stripe",
          providerEnv: provider.env,
          eventId,
          eventType,
          status: "pending",
          payload: body ?? {},
          errorMessage: null,
          processedAt: null,
        })
        .returning();
      webhookRow = inserted;
    } catch (err: any) {
      if (err.code === "23505") {
        const [existing] = await db
          .select()
          .from(webhooks)
          .where(
            and(
              eq(webhooks.provider as any, "stripe"),
              eq(webhooks.providerEnv as any, provider.env),
              eq(webhooks.eventId as any, eventId),
            ),
          )
          .limit(1);

        if (existing?.status === "ok") {
          request.log.info({ eventId }, "Stripe webhook already processed ok");
          reply.code(200);
          return { ok: true, message: "Event already processed" };
        }

        // failed/pending → allow retry of business processing
        webhookRow = existing;
        if (existing) {
          await db
            .update(webhooks)
            .set({
              status: "pending",
              errorMessage: null,
              payload: body ?? existing.payload,
            })
            .where(eq(webhooks.id, existing.id));
        }
      } else {
        throw err;
      }
    }

    // 2) Provider-Handler (signature + business logic)
    const webhookResult = await provider.handleWebhook(
      bodyString,
      request.headers as Record<string, string | string[] | undefined>
    );

    // 3) Finalize status from business result only
    if (webhookRow?.id) {
      if (webhookResult.status === "processed") {
        await db
          .update(webhooks)
          .set({
            status: "ok",
            errorMessage: null,
            processedAt: new Date(),
          })
          .where(eq(webhooks.id, webhookRow.id));
      } else {
        await db
          .update(webhooks)
          .set({
            status: "failed",
            errorMessage: webhookResult.message || "Unknown error",
            processedAt: null,
          })
          .where(eq(webhooks.id, webhookRow.id));
      }
    }

    // Signature failures should be 400 so Stripe retries / alerts
    if (
      webhookResult.status === "failed" &&
      String(webhookResult.message || "").includes("signature")
    ) {
      reply.code(400);
      return { ok: false, status: "failed", message: webhookResult.message };
    }

    // Business failure: HTTP 200 (avoid infinite Stripe retry loops for permanent
    // errors) but ok:false so callers never treat failed business as success.
    reply.code(200);
    if (webhookResult.status !== "processed") {
      return {
        ok: false,
        status: webhookResult.status,
        message: webhookResult.message,
      };
    }
    return {
      ok: true,
      status: webhookResult.status,
      message: webhookResult.message,
    };
  });
}
