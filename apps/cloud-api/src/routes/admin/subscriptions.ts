// apps/cloud-api/src/routes/admin/subscriptions.ts

import type { FastifyInstance } from "fastify";
import { registerSubscriptionsRoutes } from "../subscriptions.js";

/** @deprecated Use registerSubscriptionsRoutes — kept for import compatibility. */
export async function registerAdminSubscriptionsRoutes(app: FastifyInstance) {
  await registerSubscriptionsRoutes(app);
}
