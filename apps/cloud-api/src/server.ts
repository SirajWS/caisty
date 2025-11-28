// apps/cloud-api/src/server.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";

import { registerHealthRoute } from "./routes/health.js";
import { registerCustomersRoutes } from "./routes/customers.js";
import { registerOrgsRoutes } from "./routes/orgs.js";
import { registerSubscriptionsRoutes } from "./routes/subscriptions.js";
import { registerInvoicesRoutes } from "./routes/invoices.js";
import { registerDevicesRoutes } from "./routes/devices.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerPaymentsRoutes } from "./routes/payments.js";
import { registerWebhooksRoutes } from "./routes/webhooks.js";
import { registerLicensesRoutes } from "./routes/licenses.js";
import { registerPublicLicenseRoutes } from "./routes/public-license.js";

// 🔹 Portal (eigenes JWT)
import { registerPortalAuthRoutes } from "./routes/portalAuthRoutes.js";
import { registerPortalDataRoutes } from "./routes/portal-data.js";
import { registerPortalSupportRoutes } from "./routes/portal-support.js";
import { registerPortalTrialLicenseRoutes } from "./routes/portal-trial-license.js";

import { verifyToken } from "./lib/jwt.js";
import { registerAdminNotificationsRoutes } from "./routes/admin-notifications.js";

export async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
  });

  // ---------------------------------------------------------------------------
  // Globaler Auth-Hook für die Admin-API (nicht für /portal/*)
  // ---------------------------------------------------------------------------
  app.addHook("onRequest", async (request, reply) => {
    const url = request.raw.url?.split("?")[0] ?? "";
    const method = request.method.toUpperCase();

    // 🔓 Endpunkte, die KEIN Admin-JWT brauchen:
    const isPublicRoute =
      url === "/health" ||
      url === "/auth/login" ||
      url.startsWith("/portal/") ||
      (url === "/webhooks/paypal" && method === "POST") ||
      (url === "/licenses/verify" && method === "POST") ||
      (url === "/devices/bind" && method === "POST") ||
      (url === "/devices/heartbeat" && method === "POST");

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
      (request as any).user = payload;
    } catch (err) {
      request.log.warn({ err }, "Invalid or expired JWT");
      reply.code(401);
      return reply.send({ error: "Invalid or expired token" });
    }
  });

  // ---------------------------------------------------------------------------
  // Öffentliche / Basis-Routen
  // ---------------------------------------------------------------------------
  await registerHealthRoute(app);
  await registerAuthRoutes(app);

  // ---------------------------------------------------------------------------
  // Portal-Routen (eigener JWT via portalJwt)
  // ---------------------------------------------------------------------------
  await registerPortalAuthRoutes(app);          // /portal/register, /portal/login, /portal/me, ...
  await registerPortalDataRoutes(app);          // /portal/licenses, /portal/devices, /portal/invoices
  await registerPortalTrialLicenseRoutes(app);  // /portal/trial-license
  await registerPortalSupportRoutes(app);       // /portal/support-...

  // Admin-Notifications laufen über Admin-JWT (kein /portal/)
  await registerAdminNotificationsRoutes(app);

  // ---------------------------------------------------------------------------
  // Admin-APIs (durch Hook oben JWT-geschützt)
  // ---------------------------------------------------------------------------
  await registerCustomersRoutes(app);
  await registerOrgsRoutes(app);
  await registerSubscriptionsRoutes(app);
  await registerInvoicesRoutes(app);
  await registerDevicesRoutes(app);
  await registerLicensesRoutes(app);

  // ---------------------------------------------------------------------------
  // Öffentliche License-/Device-API für POS (verify/bind/heartbeat)
  // ---------------------------------------------------------------------------
  await registerPublicLicenseRoutes(app);

  // ---------------------------------------------------------------------------
  // Payments & Webhooks
  // ---------------------------------------------------------------------------
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
