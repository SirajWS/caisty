import "dotenv/config";
import { fetchPortalOrdersPage } from "../src/lib/portalOrdersPage.js";
import { db } from "../src/db/client.js";
import { customers } from "../src/db/schema/customers.js";
import { eq } from "drizzle-orm";

const [customer] = await db.select().from(customers).limit(1);
if (!customer) {
  console.log("No customer in DB — skipping live query check");
  process.exit(0);
}

try {
  const result = await fetchPortalOrdersPage({
    orgId: customer.orgId,
    customerId: customer.id,
  });
  console.log(
    "fetchPortalOrdersPage OK:",
    result.orders.length,
    "live orders,",
    result.providerOrders.length,
    "provider orders",
  );
} catch (err) {
  console.error("fetchPortalOrdersPage FAILED:", err);
  process.exit(1);
}

process.exit(0);
