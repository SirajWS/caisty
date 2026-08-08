import type { FastifyInstance } from "fastify";

import { channelWebhookService } from "../lib/channelWebhookService.js";

export async function registerChannelWebhooksRoutes(app: FastifyInstance) {
  app.post("/webhooks/channels/:slug", async (request, reply) => {
    const slug = String((request.params as { slug?: string }).slug ?? "").trim();
    if (!slug) {
      reply.code(422);
      return { ok: false, code: "missing_slug", message: "Channel slug is required." };
    }

    try {
      const result = await channelWebhookService.ingestWebhook({
        slug,
        body: request.body,
        rawBody: (request as { rawBody?: string }).rawBody,
      });

      if (!result.ok) {
        reply.code(result.statusCode);
        return {
          ok: false,
          code: result.code,
          message: result.message,
        };
      }

      reply.code(201);
      return {
        ok: true,
        orderId: result.orderId,
        pullSnapshot: result.pullSnapshot,
      };
    } catch (err: unknown) {
      request.log.error({ err, slug }, "POST /webhooks/channels/:slug failed");
      reply.code(500);
      return { ok: false, code: "server_error", message: "Webhook processing failed." };
    }
  });
}
