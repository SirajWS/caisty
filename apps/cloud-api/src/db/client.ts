// apps/cloud-api/src/db/client.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.js";

// Validate DATABASE_URL before creating connection
if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required but not set in environment variables");
}

const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  onnotice: () => {}, // Suppress notices
  connection: {
    application_name: "caisty-cloud-api",
  },
});

// Test connection on startup (non-blocking)
queryClient`SELECT 1`.then(() => {
  console.log("✅ Database connection established");
}).catch((err) => {
  console.error("❌ Database connection failed:", err.message);
  console.error("   DATABASE_URL:", env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
  console.error("   ⚠️  Server will continue, but DB queries will fail");
  // Don't exit - let the server start and show errors on first query
});

export const db = drizzle(queryClient);
