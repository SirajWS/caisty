import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { sql } from "drizzle-orm";

export async function registerHealthRoute(app: FastifyInstance) {
  app.get("/health", async (request, reply) => {
    try {
      // Test database connection
      await db.execute(sql`SELECT 1`);
      
      const businessProbe = await app.inject({
        method: "GET",
        url: "/portal/business",
      });
      const portalBusinessRoute =
        businessProbe.statusCode !== 404 ||
        !String(businessProbe.body).includes("Route GET:/portal/business");

      return {
        ok: true,
        ts: new Date().toISOString(),
        database: "connected",
        portalBusinessRoute,
        adminDeleteRoutes: [
          "DELETE /admin/devices/:deviceId",
          "DELETE /admin/subscriptions/:subscriptionId",
        ],
        portalRoutes: portalBusinessRoute
          ? ["GET /portal/business", "PATCH /portal/business", "GET /portal/business/pos-config"]
          : [],
      };
    } catch (err: any) {
      request.log.error({ err }, "Health check failed - database not reachable");
      reply.code(503); // Service Unavailable
      return {
        ok: false,
        ts: new Date().toISOString(),
        database: "disconnected",
        error: err?.message || "Database connection failed",
      };
    }
  });
}
