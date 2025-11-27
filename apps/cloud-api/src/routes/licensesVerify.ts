// apps/api/src/routes/licensesVerify.ts
import type { FastifyInstance } from "fastify";
import { registerLicenseVerifyRoute } from "./licenses/verify";

export default async function licensesVerifyRoutes(app: FastifyInstance) {
  await registerLicenseVerifyRoute(app);
}
