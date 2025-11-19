// apps/cloud-api/src/routes/devices.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { devices } from "../db/schema/devices";

export async function registerDevicesRoutes(app: FastifyInstance) {
  app.get("/devices", async () => {
    const items = await db.select().from(devices).limit(50);

    return {
      items,
      total: items.length,
      limit: 50,
      offset: 0,
    };
  });
}
