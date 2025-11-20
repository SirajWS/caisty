// apps/cloud-api/src/routes/devices.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { devices } from "../db/schema/devices";
import { licenses } from "../db/schema/licenses";
import { eq } from "drizzle-orm";

export async function registerDevicesRoutes(app: FastifyInstance) {
  app.get("/devices", async (request, reply) => {
    try {
      const rows = await db
        .select({
          id: devices.id,
          name: devices.name,
          type: devices.type,
          status: devices.status,
          lastHeartbeatAt: devices.lastHeartbeatAt,
          createdAt: devices.createdAt,
          // 🔽 neu: Lizenz-Infos
          licensePlan: licenses.plan,
          licenseKey: licenses.key,
        })
        .from(devices)
        .leftJoin(licenses, eq(devices.licenseId, licenses.id))
        .limit(50);

      app.log.info(
        { count: rows.length },
        "Loaded devices with license info from DB",
      );

      return {
        items: rows,
        total: rows.length,
        limit: 50,
        offset: 0,
      };
    } catch (error) {
      app.log.error(
        { err: error instanceof Error ? error.message : String(error) },
        "DB error in GET /devices",
      );

      reply.code(500);
      return {
        error: "Failed to load devices",
      };
    }
  });
}
