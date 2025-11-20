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
import { registerPaymentsRoutes } from "./routes/payments";
import { registerWebhooksRoutes } from "./routes/webhooks";
import { registerLicensesRoutes } from "./routes/licenses";
import { registerPublicLicenseRoutes } from "./routes/public-license";

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
    const method = request.method.toUpperCase();

    // Öffentliche Routen: keine Auth
    const isPublicRoute =
      url === "/health" ||
      url === "/auth/login" ||
      (url === "/webhooks/paypal" && method === "POST") || // M4: PayPal-Webhook
      (url === "/licenses/verify" && method === "POST") || // M5: POS License-Check
      (url === "/devices/bind" && method === "POST") || // M5: POS Device-Bind
      (url === "/devices/heartbeat" && method === "POST"); // M5: POS Heartbeat

    if (isPublicRoute) {
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
  await registerAuthRoutes(app); // /auth/login bleibt öffentlich

  await registerCustomersRoutes(app);
  await registerOrgsRoutes(app);
  await registerSubscriptionsRoutes(app);
  await registerInvoicesRoutes(app);
  await registerDevicesRoutes(app);

  // 🟣 M5: Licenses (Admin-API)
  await registerLicensesRoutes(app);

  // 🟣 M5: Öffentliche License-/Device-Routen für POS
  await registerPublicLicenseRoutes(app);

  // 🟣 M4: Payments & Webhooks
  await registerPaymentsRoutes(app);
  await registerWebhooksRoutes(app);

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
