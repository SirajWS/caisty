// apps/cloud-api/src/server.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env";

import { registerHealthRoute } from "./routes/health";
import { registerCustomersRoutes } from "./routes/customers";
import { registerOrgsRoutes } from "./routes/orgs";
import { registerSubscriptionsRoutes } from "./routes/subscriptions";
import { registerInvoicesRoutes } from "./routes/invoices";
import { registerDevicesRoutes } from "./routes/devices";
import { registerAuthRoutes } from "./routes/auth";
import { verifyToken } from "./lib/jwt";

export async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
  });

  // 🔐 Globaler Auth-Hook (läuft für alle Routen)
  app.addHook("onRequest", async (request, reply) => {
    const url = request.raw.url?.split("?")[0] ?? "";

    // Öffentliche Routen: keine Auth
    if (url === "/health" || url === "/auth/login") {
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
      const payload = verifyToken(token);
      // Nutzer am Request ablegen (für spätere Nutzung)
      (request as any).user = payload;
    } catch (err) {
      request.log.warn({ err }, "Invalid or expired JWT");
      reply.code(401);
      return reply.send({ error: "Invalid or expired token" });
    }
  });

  // ▶ Routen registrieren
  await registerHealthRoute(app);
  await registerAuthRoutes(app);          // /auth/login bleibt öffentlich
  await registerCustomersRoutes(app);
  await registerOrgsRoutes(app);
  await registerSubscriptionsRoutes(app);
  await registerInvoicesRoutes(app);
  await registerDevicesRoutes(app);

  return app;
}

async function main() {
  const app = await buildServer();

  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`Cloud API listening on http://127.0.0.1:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
