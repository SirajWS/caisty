// src/routes/health.ts
import type { FastifyInstance } from "fastify";

export async function registerHealthRoute(app: FastifyInstance) {
  app.get("/health", async () => {
    return { ok: true, ts: new Date().toISOString() };
  });
}
