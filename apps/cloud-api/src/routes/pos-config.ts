// Public POS fiscal configuration (device + license scoped, no secrets).
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { licenses } from "../db/schema/licenses.js";
import { businessProfiles } from "../db/schema/businessProfiles.js";
import { orgs } from "../db/schema/orgs.js";
import { syncFiscalConfigurationForOrg } from "../fiscal/fiscalConfigurationService.js";
import { buildPosSyncConfig } from "../fiscal/buildPosSyncConfig.js";
import {
  DEVICE_RELEASED_STATUS,
  findDeviceById,
} from "../lib/deviceLifecycleService.js";

type PosConfigQuery = {
  deviceId?: string;
  licenseKey?: string;
};

export async function registerPosConfigRoutes(app: FastifyInstance) {
  /**
   * GET /pos/config?deviceId=...&licenseKey=...
   * Phase V: full business + fiscal + license + device + sync payload for POS Desktop.
   */
  app.get<{ Querystring: PosConfigQuery }>(
    "/pos/config",
    async (request, reply) => {
      const { deviceId, licenseKey } = request.query;

      if (!deviceId?.trim() || !licenseKey?.trim()) {
        reply.code(400);
        return {
          ok: false,
          error: "invalid_request",
          message: "deviceId and licenseKey are required.",
        };
      }

      const [license] = await db
        .select()
        .from(licenses)
        .where(eq(licenses.key, licenseKey.trim()))
        .limit(1);

      if (!license || license.status !== "active") {
        reply.code(403);
        return { ok: false, error: "invalid_license" };
      }

      const device = await findDeviceById(deviceId.trim());

      if (!device) {
        reply.code(404);
        return { ok: false, error: "device_not_found" };
      }

      if (device.status === DEVICE_RELEASED_STATUS || !device.licenseId) {
        reply.code(403);
        return { ok: false, error: "device_released" };
      }

      if (String(device.licenseId) !== String(license.id)) {
        reply.code(403);
        return { ok: false, error: "device_not_bound" };
      }

      const orgId = license.orgId;
      if (!orgId) {
        reply.code(404);
        return { ok: false, error: "org_not_found" };
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
