// apps/cloud-api/src/routes/debug-db.ts
// DEBUG ENDPOINT - Nur für Development
import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { invoices } from "../db/schema/invoices.js";
import { sql } from "drizzle-orm";

export async function registerDebugDbRoutes(app: FastifyInstance) {
  // GET /debug/db/test - Test DB connection and schema
  app.get("/debug/db/test", async (request, reply) => {
    try {
      // Test 1: Basic connection
      const connectionTest = await db.execute(sql`SELECT 1 as test`);
      
      // Test 2: Check if invoices table exists
      let tableExists = false;
      let tableColumns: any[] = [];
      try {
        const result = await db.execute(sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'invoices'
          ORDER BY ordinal_position
        `);
        tableExists = true;
        // Postgres returns array directly
        tableColumns = Array.isArray(result) ? result : [];
      } catch (err: any) {
        return {
          ok: false,
          error: "Table check failed",
          message: err.message,
          connection: "ok",
          tableExists: false,
        };
      }

      // Test 3: Try a simple query
      let queryTest: any = null;
      try {
        queryTest = await db.select().from(invoices).limit(1);
      } catch (queryErr: any) {
        return {
          ok: false,
          error: "Query test failed",
          message: queryErr.message,
          stack: process.env.NODE_ENV === "development" ? queryErr.stack : undefined,
          connection: "ok",
          tableExists,
          columns: tableColumns,
        };
      }

      return {
        ok: true,
        connection: "ok",
        tableExists,
        columns: tableColumns,
        sampleQuery: "ok",
        sampleData: queryTest.length > 0 ? "has data" : "empty",
      };
    } catch (err: any) {
      reply.code(500);
      return {
        ok: false,
        error: "Database connection failed",
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        hint: "Check DATABASE_URL in .env file",
      };
    }
  });
}

