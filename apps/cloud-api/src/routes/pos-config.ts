// Public POS fiscal configuration (device + license scoped, no secrets).
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { licenses } from "../db/schema/licenses.js";
import { businessProfiles } from "../db/schema/businessProfiles.js";
import { orgs } from "../db/schema/orgs.js";
import { syncFiscalConfigurationForOrg } from "../fiscal/fiscalConfigurationService.js";
import { buildPosSyncConfig } from "../fiscal/buildPosSyncConfig.js";
import { findDeviceById } from "../lib/deviceLifecycleService.js";
import {
  authenticatePosDevice,
  formatPosDeviceAuthFailure,
} from "../lib/posDeviceAuth.js";

type PosConfigQuery = {
  deviceId?: string;
  licenseKey?: string;
};

export async function registerPosConfigRoutes(app: FastifyInstance) {
  app.get<{ Querystring: PosConfigQuery }>(
    "/pos/config",
    async (request, reply) => {
      const { deviceId, licenseKey } = request.query;

      const auth = await authenticatePosDevice({ deviceId, licenseKey });

      if (!auth.ok) {
        reply.code(auth.statusCode);
        return formatPosDeviceAuthFailure(auth);
      }

      const [license] = await db
        .select()
        .from(licenses)
        .where(eq(licenses.key, licenseKey!.trim()))
        .limit(1);

      if (!license) {
        reply.code(404);
        return { ok: false, error: "device_not_found" };
      }

      const orgId = license.orgId;
      if (!orgId) {
        reply.code(404);
        return { ok: false, error: "org_not_found" };
      }

      const device = await findDeviceById(auth.context.deviceId);

      if (!device) {
        reply.code(404);
        return { ok: false, error: "device_not_found" };
      }

      const [businessRow] = await db
        .select()
        .from(businessProfiles)
        .where(eq(businessProfiles.orgId, orgId))
        .limit(1);

      if (!businessRow) {
        reply.code(404);
        return {
          ok: false,
          error: "business_profile_missing",
          message: "Complete business setup in the customer portal first.",
        };
      }

      const [org] = await db
        .select({ name: orgs.name })
        .from(orgs)
        .where(eq(orgs.id, orgId))
        .limit(1);

      try {
        const fiscalSnapshot = await syncFiscalConfigurationForOrg(
          orgId,
          businessRow,
        );
        const payload = buildPosSyncConfig({
          businessRow,
          fiscalSnapshot,
          license,
          device,
          orgName: org?.name ?? null,
        });

        return {
          ok: true,
          ...payload,
        };
      } catch (err: unknown) {
        request.log.error({ err }, "GET /pos/config failed");
        reply.code(500);
        return { ok: false, error: "server_error" };
      }
    },
  );
}
