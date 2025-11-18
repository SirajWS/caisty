// src/server.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import { ENV } from "./config/env";
import { registerHealthRoute } from "./routes/health";

async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
  });

  await registerHealthRoute(app);

  return app;
}

async function main() {
  const app = await buildServer();

  try {
    await app.listen({ port: ENV.PORT, host: "0.0.0.0" });
    console.log(`Cloud API listening on http://127.0.0.1:${ENV.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
