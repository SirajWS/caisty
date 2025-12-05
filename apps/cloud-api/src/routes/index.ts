// apps/api/src/routes/index.ts
import type { FastifyInstance } from "fastify";

import healthRoutes from "./health";
import authRoutes from "./auth";
import customersRoutes from "./customers";
import subscriptionsRoutes from "./subscriptions";
import invoicesRoutes from "./invoices";
import devicesRoutes from "./devices";
import paymentsRoutes from "./payments";
import webhooksRoutes from "./webhooks";

// POS-Handshake-Routen
import devicesBindRoutes from "./devicesBind";
import devicesHeartbeatRoutes from "./devicesHeartbeat";

// License-Verify-Route (für Offline-Gate im POS)
import { registerLicenseVerifyRoute } from "./licenses/verify";

// Self-Service / Portal: Trial-Lizenz
import { selfServiceTrialRoutes } from "./selfService/trial";
import notificationsRoutes from "./notifications.js";

// Test-Endpoint für E-Mail (nur Development)
import { registerTestEmailRoutes } from "./test-email.js";

export default async function routes(app: FastifyInstance) {
  // Basis
  await app.register(healthRoutes);
  await app.register(authRoutes);

  // Kern-Entities
  await app.register(customersRoutes);
  await app.register(subscriptionsRoutes);
  await app.register(invoicesRoutes);

  // Geräte-API
  await app.register(devicesRoutes);
  await app.register(devicesBindRoutes);
  await app.register(devicesHeartbeatRoutes);

  // Licensing (POS-Lizenzprüfung)
  await registerLicenseVerifyRoute(app);

  // Self-Service (Portal-Trial etc.)
  await app.register(selfServiceTrialRoutes);

  await app.register(notificationsRoutes);

  // Payments & Webhooks
  await app.register(paymentsRoutes);
  await app.register(webhooksRoutes);

  // Test-Endpoint (nur Development)
  await registerTestEmailRoutes(app);
}
