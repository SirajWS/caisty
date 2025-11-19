import "dotenv/config";
import { db } from "./client";
import { orgs } from "./schema/orgs";
import { customers } from "./schema/customers";
import { subscriptions } from "./schema/subscriptions";
import { payments } from "./schema/payments";
import { webhooks } from "./schema/webhooks";

async function main() {
  console.log("Seeding demo payments & webhooks...");

  const [org] = await db.select().from(orgs).limit(1);
  const [customer] = await db.select().from(customers).limit(1);
  const [subscription] = await db.select().from(subscriptions).limit(1);

  if (!org || !customer || !subscription) {
    console.error("Fehlen Demo-Daten in orgs/customers/subscriptions!");
    process.exit(1);
  }

  await db.insert(payments).values([
    {
      orgId: org.id,
      customerId: customer.id,
      subscriptionId: subscription.id,
      provider: "paypal",
      providerPaymentId: "PAYPAL-DEMO-1",
      providerStatus: "COMPLETED",
      amountCents: 1999,
      currency: "EUR",
      status: "paid",
    },
    {
      orgId: org.id,
      customerId: customer.id,
      subscriptionId: subscription.id,
      provider: "paypal",
      providerPaymentId: "PAYPAL-DEMO-2",
      providerStatus: "FAILED",
      amountCents: 9900,
      currency: "EUR",
      status: "failed",
    },
  ]);

  await db.insert(webhooks).values([
    {
      orgId: org.id,
      provider: "paypal",
      eventType: "PAYMENT.SALE.COMPLETED",
      status: "processed",
      payload: { stub: true, source: "seed" },
      errorMessage: null,
    },
    {
      orgId: org.id,
      provider: "paypal",
      eventType: "PAYMENT.SALE.DENIED",
      status: "failed",
      payload: { stub: true, source: "seed" },
      errorMessage: "Demo-Fehler aus Seed-Script",
    },
  ]);

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
