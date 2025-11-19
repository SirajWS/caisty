import Fastify from "fastify";
import cors from "@fastify/cors";
import { ENV } from "./config/env";
import { registerHealthRoute } from "./routes/health";
import { registerCustomersRoutes } from "./routes/customers";
import { registerOrgsRoutes } from "./routes/orgs";
import { registerSubscriptionsRoutes } from "./routes/subscriptions";
import { registerInvoicesRoutes } from "./routes/invoices";
import { registerDevicesRoutes } from "./routes/devices";

async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
  });

  await registerHealthRoute(app);
  await registerCustomersRoutes(app);
  await registerOrgsRoutes(app);
  await registerSubscriptionsRoutes(app);
  await registerInvoicesRoutes(app);
  await registerDevicesRoutes(app);

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
