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

// NEU: POS-Handshake-Routen
import devicesBindRoutes from "./devicesBind";           // POST /devices/bind
import devicesHeartbeatRoutes from "./devicesHeartbeat"; // POST /devices/heartbeat

export default async function routes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(authRoutes);

  await app.register(customersRoutes);
  await app.register(subscriptionsRoutes);
  await app.register(invoicesRoutes);

  // Geräte-API
  await app.register(devicesRoutes);            // evtl. bestehende /devices-Route
  await app.register(devicesBindRoutes);       // neues /devices/bind
  await app.register(devicesHeartbeatRoutes);  // neues /devices/heartbeat

  // M4: neue Routen
  await app.register(paymentsRoutes);
  await app.register(webhooksRoutes);
}
