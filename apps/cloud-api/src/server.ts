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
import { registerEmailVerificationRoutes } from "./routes/portal-email-verification.js";
import { registerPortalDataRoutes } from "./routes/portal-data.js";
import { registerPortalDevicesRoutes } from "./routes/portal-devices.js";
import { registerPortalOrdersRoutes } from "./routes/portal-orders.js";
import { registerPortalDashboardRoutes } from "./routes/portal-dashboard.js";
import { registerPortalReportsRoutes } from "./routes/portal-reports.js";
import { registerPortalReceiptsRoutes } from "./routes/portal-receipts.js";
import { registerPortalShiftsRoutes } from "./routes/portal-shifts.js";
import { registerPortalSupportRoutes } from "./routes/portal-support.js";
import { registerPortalTrialLicenseRoutes } from "./routes/portal-trial-license.js";
import { registerPortalUpgradeRoutes } from "./routes/portal-upgrade.js";
import { registerPortalLicensesRoutes } from "./routes/portal-licenses.js";
import { registerPortalInvoiceRoutes } from "./routes/portal-invoices.js";
import { registerPortalBusinessRoutes } from "./routes/portal-business.js";
import { registerPosConfigRoutes } from "./routes/pos-config.js";
import { registerPosSyncRoutes } from "./routes/pos-sync.js";
import { registerCountryConfigRoutes } from "./routes/country-config.js";
import { registerAdminFiscalRoutes } from "./routes/admin/fiscal.js";
import { registerAdminReceiptsRoutes } from "./routes/admin/receipts.js";

import { registerAdminNotificationsRoutes } from "./routes/admin-notifications.js";
import { registerAdminAnalyticsRoutes } from "./routes/admin/analytics.js";
import { registerAdminSubscriptionsRoutes } from "./routes/admin/subscriptions.js";
import { registerAdminDevicesRoutes } from "./routes/admin/devices.js";
import { registerAdminBillingReconcileRoutes } from "./routes/admin/billingReconcile.js";
import { registerAdminAuthRoutes } from "./routes/admin-auth.js";
import { registerAdminSettingsRoutes } from "./routes/admin-settings.js";

// Test-Endpoints (nur Development)
import { registerTestEmailRoutes } from "./routes/test-email.js";
import { registerTestResetTokenRoutes } from "./routes/test-reset-token.js";
import { registerDebugDbRoutes } from "./routes/debug-db.js";

import { verifyToken } from "./lib/jwt.js";
import { verifyAdminToken } from "./lib/adminJwt.js";
import { countryConfigService } from "./countryConfig/CountryConfigService.js";

export async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  // Preserve exact raw JSON bytes for Stripe webhook HMAC (supports charset=utf-8).
  // Replaces Fastify's default application/json parser once.
  app.removeContentTypeParser("application/json");
  app.addContentTypeParser(
    /^application\/json(;.*)?$/i,
    { parseAs: "buffer" },
    (req, body, done) => {
      try {
        const raw = Buffer.isBuffer(body)
          ? body.toString("utf8")
          : String(body ?? "");
        (req as { rawBody?: string }).rawBody = raw;
        const trimmed = raw.trim();
        if (!trimmed) {
          done(null, {});
          return;
        }
        done(null, JSON.parse(raw));
      } catch (err) {
        const error = err as Error & { statusCode?: number };
        error.statusCode = 400;
        done(error, undefined);
      }
    },
  );

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
      url.startsWith("/public/") || // ✅ Public POS endpoints (activate, etc.)
      url === "/auth/login" ||
      url.startsWith("/admin/auth/") || // Admin-Auth-Routes (login, forgot-password, reset-password)
      url.startsWith("/portal/") || // Portal-API (Portal-JWT)
      url.startsWith("/api/auth/") || // Email verification (public)
      url.startsWith("/api/billing/") || // Billing-API (Portal-JWT, handled in route)
      (url === "/webhooks/paypal" && method === "POST") ||
      (url === "/webhooks/stripe" && method === "POST") ||
      (url === "/licenses/verify" && method === "POST") ||
      (url === "/devices/bind" && method === "POST") ||
      (url === "/devices/heartbeat" && method === "POST") ||
      (url === "/pos/config" && method === "GET") ||
      (url === "/pos/sync/batch" && method === "POST") ||
      url.startsWith("/country-config") ||
      (url.startsWith("/invoices/") && url.endsWith("/html")) || // Invoice HTML-Export (mit Auth im Handler)
      (env.NODE_ENV === "development" && url.startsWith("/test-email")) || // Test-Endpoint nur in Development
      (env.NODE_ENV === "development" && url.startsWith("/test-reset-token")) || // Test-Endpoint nur in Development
      (env.NODE_ENV === "development" && url.startsWith("/debug/")); // Debug-Endpoints nur in Development

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
  // Country configuration (public read — site/portal)
  // ---------------------------------------------------------------------------
  await countryConfigService.warmCache(app.log);
  await registerCountryConfigRoutes(app);

  // ---------------------------------------------------------------------------
  // Öffentliche / Basis-Routen
  // ---------------------------------------------------------------------------
  await registerHealthRoute(app);
  await registerAuthRoutes(app);

  // Debug-Routen (nur Development)
  if (env.NODE_ENV === "development") {
    await registerDebugDbRoutes(app);
  }

  // ---------------------------------------------------------------------------
  // Portal-Routen (nutzen eigenes JWT via portalJwt)
  // ---------------------------------------------------------------------------
  await registerPortalAuthRoutes(app);
  await registerPortalGoogleAuthRoutes(app); // Google OAuth
  await registerPortalPasswordResetRoutes(app); // Password Reset
  await registerEmailVerificationRoutes(app); // Email verification
  await registerPortalDataRoutes(app);
  await registerPortalDevicesRoutes(app);
  await registerPortalOrdersRoutes(app);
  await registerPortalDashboardRoutes(app);
  await registerPortalReportsRoutes(app);
  await registerPortalReceiptsRoutes(app);
  await registerPortalShiftsRoutes(app);
  await registerPortalTrialLicenseRoutes(app);
  await registerPortalSupportRoutes(app);
  await registerPortalUpgradeRoutes(app); // Upgrade + PayPal
  await registerPortalLicensesRoutes(app); // "Meine Lizenzen" (Portal-Liste)
  await registerPortalInvoiceRoutes(app); // Invoice-Details
  await registerPortalBusinessRoutes(app); // Business profile (company, tax, fiscal)

  // ---------------------------------------------------------------------------
  // Admin-Auth (neues Admin-Auth-System)
  // ---------------------------------------------------------------------------
  await registerAdminAuthRoutes(app);
  await registerAdminSettingsRoutes(app); // Superadmin-Settings

  // ---------------------------------------------------------------------------
  // Admin-Notifications (Admin-JWT)
  // ---------------------------------------------------------------------------
  await registerAdminNotificationsRoutes(app);
  await registerAdminAnalyticsRoutes(app);
  await registerAdminSubscriptionsRoutes(app);
  await registerAdminDevicesRoutes(app);
  await registerAdminBillingReconcileRoutes(app);
  await registerAdminFiscalRoutes(app);
  await registerAdminReceiptsRoutes(app);

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
  await registerPosConfigRoutes(app);
  await registerPosSyncRoutes(app);

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

  // Sanity-check: 401/403/404(not_found) means route exists; Fastify route-404 does not.
  const routeProbe = await app.inject({
    method: "DELETE",
    url: "/admin/subscriptions/00000000-0000-0000-0000-000000000000",
  });
  if (
    routeProbe.statusCode === 404 &&
    routeProbe.body.includes("Route DELETE:")
  ) {
    app.log.error(
      "CRITICAL: DELETE /admin/subscriptions/:subscriptionId is NOT registered",
    );
  } else {
    app.log.info("Admin DELETE routes OK (devices + pending subscriptions)");
  }

  const businessProbe = await app.inject({
    method: "GET",
    url: "/portal/business",
  });
  if (
    businessProbe.statusCode === 404 &&
    businessProbe.body.includes("Route GET:/portal/business")
  ) {
    app.log.error(
      "CRITICAL: GET /portal/business is NOT registered — redeploy cloud-api from current main",
    );
  } else {
    app.log.info("Portal business routes OK (GET/PATCH /portal/business)");
  }

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
