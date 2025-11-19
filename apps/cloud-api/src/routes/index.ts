import type { FastifyInstance } from "fastify";

import healthRoutes from "./health";
import authRoutes from "./auth";
import customersRoutes from "./customers";
import subscriptionsRoutes from "./subscriptions";
import invoicesRoutes from "./invoices";
import devicesRoutes from "./devices";
import paymentsRoutes from "./payments";
import webhooksRoutes from "./webhooks";

export default async function routes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(authRoutes);

  await app.register(customersRoutes);
  await app.register(subscriptionsRoutes);
  await app.register(invoicesRoutes);
  await app.register(devicesRoutes);

  // M4: neue Routen
  await app.register(paymentsRoutes);
  await app.register(webhooksRoutes);
}
