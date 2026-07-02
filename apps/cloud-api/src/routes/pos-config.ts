// Public POS fiscal configuration (device + license scoped, no secrets).
import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { devices } from "../db/schema/devices.js";
import { licenses } from "../db/schema/licenses.js";
import { businessProfiles } from "../db/schema/businessProfiles.js";
import {
  toSafePosFiscalConfig,
} from "../fiscal/buildFiscalConfiguration.js";
import { syncFiscalConfigurationForOrg } from "../fiscal/fiscalConfigurationService.js";

type PosConfigQuery = {
  deviceId?: string;
  licenseKey?: string;
};

export async function registerPosConfigRoutes(app: FastifyInstance) {
  /**
   * GET /pos/config?deviceId=...&licenseKey=...
   * Returns customer-safe cloud fiscal configuration for a bound POS device.
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

      const [device] = await db
        .select()
        .from(devices)
        .where(
          and(
            eq(devices.id, deviceId.trim()),
            eq(devices.licenseId, license.id),
          ),
        )
        .limit(1);

      if (!device) {
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

      try {
        const snapshot = await syncFiscalConfigurationForOrg(
          orgId,
          businessRow,
        );
        return {
          ok: true,
          config: toSafePosFiscalConfig(snapshot),
        };
      } catch (err: unknown) {
        request.log.error({ err }, "GET /pos/config failed");
        reply.code(500);
        return { ok: false, error: "server_error" };
      }
    },
  );
}
