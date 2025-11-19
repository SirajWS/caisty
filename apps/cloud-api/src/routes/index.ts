// Beispiel: apps/cloud-api/src/routes/index.ts
import type { FastifyInstance } from "fastify";

import healthRoutes from "./health";
import customersRoutes from "./customers";
import subscriptionsRoutes from "./subscriptions";
import invoicesRoutes from "./invoices";
import devicesRoutes from "./devices";
import authRoutes from "./auth";

export default async function routes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(authRoutes); // <-- neu

  await app.register(customersRoutes);
  await app.register(subscriptionsRoutes);
  await app.register(invoicesRoutes);
  await app.register(devicesRoutes);
}
