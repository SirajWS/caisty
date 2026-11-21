import type { FastifyInstance } from "fastify";

import { env } from "../config/env.js";
import {
  assertPlatformSuperadmin,
  isPlatformAdminRoute,
  isPublicUnauthenticatedRoute,
} from "./platformAdminAuth.js";
import { authenticateBearer } from "./requestAuth.js";

export async function registerCloudApiAuthHook(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    const url = request.raw.url?.split("?")[0] ?? "";
    const method = request.method.toUpperCase();

    if (isPublicUnauthenticatedRoute(url, method, env.NODE_ENV)) {
      return;
    }

    const auth = request.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      reply.code(401);
      return reply.send({
        error: "Missing or invalid Authorization header",
      });
    }

    const token = auth.slice("Bearer ".length);

    try {
      (request as { user?: unknown }).user = authenticateBearer(token);
    } catch (err) {
      request.log.warn({ err }, "Invalid or expired JWT");
      reply.code(401);
      return reply.send({ error: "Invalid or expired token" });
    }

    if (isPlatformAdminRoute(url, method)) {
      const ok = await assertPlatformSuperadmin(request, reply);
      if (!ok) return;
    }
  });
}
