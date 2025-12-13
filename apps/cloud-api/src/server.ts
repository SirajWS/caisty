// apps/cloud-api/src/server.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";

import { registerHealthRoute } from "./routes/health.js";
import { registerAuthRoutes } from "./routes/auth.js";

import { registerCustomersRoutes } from "./routes/customers.js";
import { registerOrgsRoutes } from "./routes/orgs.js";
import { registerSubscriptionsRoutes } from "./routes/subscriptions.js";
import { registerInvoicesRoutes } from "./routes/invoices.js";
import { registerDevicesRoutes } from "./routes/devices.js";
import { registerLicensesRoutes } from "./routes/licenses.js";
import { registerPublicLicenseRoutes } from "./routes/public-license.js";

import { registerPaymentsRoutes } from "./routes/payments.js";
import { registerWebhooksRoutes } from "./routes/webhooks.js";
import { registerBillingRoutes } from "./routes/billing.js";

// 🔹 Portal (eigenes JWT, separate Auth)
import { registerPortalAuthRoutes } from "./routes/portalAuthRoutes.js";
import { registerPortalGoogleAuthRoutes } from "./routes/portal-google-auth.js";
import { registerPortalPasswordResetRoutes } from "./routes/portal-password-reset.js";
import { registerPortalDataRoutes } from "./routes/portal-data.js";
import { registerPortalSupportRoutes } from "./routes/portal-support.js";
import { registerPortalTrialLicenseRoutes } from "./routes/portal-trial-license.js";
import { registerPortalUpgradeRoutes } from "./routes/portal-upgrade.js";
import { registerPortalLicensesRoutes } from "./routes/portal-licenses.js";
import { registerPortalInvoiceRoutes } from "./routes/portal-invoices.js";

import { registerAdminNotificationsRoutes } from "./routes/admin-notifications.js";
import { registerAdminAuthRoutes } from "./routes/admin-auth.js";
import { registerAdminSettingsRoutes } from "./routes/admin-settings.js";

// Test-Endpoints (nur Development)
import { registerTestEmailRoutes } from "./routes/test-email.js";
import { registerTestResetTokenRoutes } from "./routes/test-reset-token.js";

import { verifyToken } from "./lib/jwt.js";
import { verifyAdminToken } from "./lib/adminJwt.js";

export async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  // ---------------------------------------------------------------------------
  // CORS
  // ---------------------------------------------------------------------------
  await app.register(cors, {
    origin: true,
  });

  // ---------------------------------------------------------------------------
  // Globaler Auth-Hook für die Admin-API (nicht für /portal/*)
  // ---------------------------------------------------------------------------
  app.addHook("onRequest", async (request, reply) => {
    const url = request.raw.url?.split("?")[0] ?? "";
    const method = request.method.toUpperCase();

    const isPublicRoute =
      url === "/health" ||
      url === "/auth/login" ||
      url.startsWith("/admin/auth/") || // Admin-Auth-Routes (login, forgot-password, reset-password)
      url.startsWith("/portal/") || // Portal-API (Portal-JWT)
      (url === "/webhooks/paypal" && method === "POST") ||
      (url === "/licenses/verify" && method === "POST") ||
      (url === "/devices/bind" && method === "POST") ||
      (url === "/devices/heartbeat" && method === "POST") ||
      (url.startsWith("/invoices/") && url.endsWith("/html")) || // Invoice HTML-Export (mit Auth im Handler)
      (env.NODE_ENV === "development" && url.startsWith("/test-email")) || // Test-Endpoint nur in Development
      (env.NODE_ENV === "development" && url.startsWith("/test-reset-token")); // Test-Endpoint nur in Development

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
      // Versuche zuerst Admin-JWT, dann normales JWT
      try {
        const adminPayload = verifyAdminToken(token);
        (request as any).user = {
          ...adminPayload,
          isAdmin: true, // Flag für Admin-User
        };
      } catch {
        // Falls Admin-JWT fehlschlägt, versuche normales JWT
        const payload = verifyToken(token);
        (request as any).user = payload;
      }
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
  // Portal-Routen (nutzen eigenes JWT via portalJwt)
  // ---------------------------------------------------------------------------
  await registerPortalAuthRoutes(app);
  await registerPortalGoogleAuthRoutes(app); // Google OAuth
  await registerPortalPasswordResetRoutes(app); // Password Reset
  await registerPortalDataRoutes(app);
  await registerPortalTrialLicenseRoutes(app);
  await registerPortalSupportRoutes(app);
  await registerPortalUpgradeRoutes(app);    // Upgrade + PayPal
  await registerPortalLicensesRoutes(app);   // "Meine Lizenzen" (Portal-Liste)
  await registerPortalInvoiceRoutes(app);    // Invoice-Details

  // ---------------------------------------------------------------------------
  // Admin-Auth (neues Admin-Auth-System)
  // ---------------------------------------------------------------------------
  await registerAdminAuthRoutes(app);
  await registerAdminSettingsRoutes(app); // Superadmin-Settings

  // ---------------------------------------------------------------------------
  // Admin-Notifications (Admin-JWT)
  // ---------------------------------------------------------------------------
  await registerAdminNotificationsRoutes(app);

  // ---------------------------------------------------------------------------
  // Admin-APIs (interne Cloud-Admin-Oberfläche)
  // ---------------------------------------------------------------------------
  await registerCustomersRoutes(app);
  await registerOrgsRoutes(app);
  await registerSubscriptionsRoutes(app);
  await registerInvoicesRoutes(app);
  await registerDevicesRoutes(app);
  await registerLicensesRoutes(app);

  // ---------------------------------------------------------------------------
  // Öffentliche License-/Device-API für POS
  // ---------------------------------------------------------------------------
  await registerPublicLicenseRoutes(app);

  // ---------------------------------------------------------------------------
  // Payments & Webhooks
  // ---------------------------------------------------------------------------
  await registerPaymentsRoutes(app);
  await registerWebhooksRoutes(app);
  await registerBillingRoutes(app);

  // ---------------------------------------------------------------------------
  // Test-Endpoints (nur Development)
  // ---------------------------------------------------------------------------
  await registerTestEmailRoutes(app);
  await registerTestResetTokenRoutes(app);

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
