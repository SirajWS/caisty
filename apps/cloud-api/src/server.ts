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

// 🔹 Portal (eigenes JWT)
// WICHTIG: Datei heißt portalAuthRoutes.ts, nicht portal-auth.ts
import { registerPortalAuthRoutes } from "./routes/portalAuthRoutes";
import { registerPortalDataRoutes } from "./routes/portal-data";
// (später: import { registerPortalSupportRoutes } from "./routes/portalSupport";
//          import { registerNotificationsRoutes } from "./routes/notifications"; )

import { verifyToken } from "./lib/jwt";
import { registerAdminNotificationsRoutes } from "./routes/admin-notifications";

import { registerPortalSupportRoutes } from "./routes/portal-support"; // ggf. mit .js wie bei den anderen Imports

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
  await registerPortalAuthRoutes(app);   // /portal/register, /portal/login, /portal/me, ...
  await registerPortalDataRoutes(app);   // /portal/licenses, /portal/devices, /portal/invoices
  // später:
  // await registerPortalSupportRoutes(app);      // /portal/support...
  // await registerNotificationsRoutes(app);      // falls du Portal-spezifische Notifications brauchst
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
  
  await registerPortalSupportRoutes(app);

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
