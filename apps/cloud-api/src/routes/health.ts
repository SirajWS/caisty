import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { sql } from "drizzle-orm";

export async function registerHealthRoute(app: FastifyInstance) {
  app.get("/health", async (request, reply) => {
    try {
      // Test database connection
      await db.execute(sql`SELECT 1`);
      
      return {
        ok: true,
        ts: new Date().toISOString(),
        database: "connected",
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
