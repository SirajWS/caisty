import { db } from "./client";
import { orgs } from "./schema/orgs";
import { users } from "./schema/users";
import { customers } from "./schema/customers";
import { subscriptions } from "./schema/subscriptions";
import { invoices } from "./schema/invoices";
import { devices } from "./schema/devices";

async function main() {
  console.log("Seeding database…");

  // Reihenfolge wegen Foreign Keys: erst Kinder löschen, dann Eltern
  await db.delete(invoices);
  await db.delete(subscriptions);
  await db.delete(devices);
  await db.delete(customers);
  await db.delete(users);
  await db.delete(orgs);

  // 1) Org
  const [caistyOrg] = await db
    .insert(orgs)
    .values({
      name: "Caisty Test Org",
      slug: "caisty-test-org",
    })
    .returning();

  // 2) Users (für späteres M3-Login)
  const [bossUser, adminUser] = await db
    .insert(users)
    .values([
      {
        orgId: caistyOrg.id,
        email: "boss@caisty.local",
        fullName: "Boss Admin",
        role: "owner",
      },
      {
        orgId: caistyOrg.id,
        email: "admin@caisty.local",
        fullName: "Admin User",
        role: "admin",
      },
    ])
    .returning();

  console.log("Created users:", bossUser.email, adminUser.email);

  // 3) Customers
  const [alice, bob, charlie] = await db
    .insert(customers)
    .values([
      {
        orgId: caistyOrg.id,
        name: "Alice GmbH",
        email: "alice@example.com",
        status: "active",
      },
      {
        orgId: caistyOrg.id,
        name: "Bob OHG",
        email: "bob@example.com",
        status: "active",
      },
      {
        orgId: caistyOrg.id,
        name: "Charlie e.K.",
        email: "charlie@example.com",
        status: "inactive",
      },
    ])
    .returning();

  console.log("Created customers:", alice.email, bob.email, charlie.email);

  // 4) Subscriptions
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [subAlice, subBob] = await db
    .insert(subscriptions)
    .values([
      {
        orgId: caistyOrg.id,
        customerId: alice.id,
        plan: "starter",
        status: "active",
        priceCents: 4900,
        currency: "EUR",
        startedAt: now,
        currentPeriodEnd: in30Days,
      },
      {
        orgId: caistyOrg.id,
        customerId: bob.id,
        plan: "pro",
        status: "trialing",
        priceCents: 7900,
        currency: "EUR",
        startedAt: now,
        currentPeriodEnd: in30Days,
      },
    ])
    .returning();

  // 5) Invoices
  await db.insert(invoices).values([
    {
      orgId: caistyOrg.id,
      customerId: alice.id,
      subscriptionId: subAlice.id,
      number: "INV-2025-0001",
      amountCents: 4900,
      currency: "EUR",
      status: "paid",
      issuedAt: now,
      dueAt: now,
    },
    {
      orgId: caistyOrg.id,
      customerId: bob.id,
      subscriptionId: subBob.id,
      number: "INV-2025-0002",
      amountCents: 7900,
      currency: "EUR",
      status: "open",
      issuedAt: now,
      dueAt: in30Days,
    },
  ]);

  // 6) Devices
  await db.insert(devices).values([
    {
      orgId: caistyOrg.id,
      customerId: alice.id,
      name: "Kasse 1",
      type: "pos",
      status: "active",
    },
    {
      orgId: caistyOrg.id,
      customerId: bob.id,
      name: "Kasse 2",
      type: "pos",
      status: "active",
    },
  ]);

  console.log("Seeding done.");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error during seeding:", err);
    process.exit(1);
  });
