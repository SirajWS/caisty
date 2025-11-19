// apps/cloud-api/src/db/seed.ts
import { db } from "./client";
import { orgs } from "./schema/orgs";
import { users } from "./schema/users";
import { customers } from "./schema/customers";
import { subscriptions } from "./schema/subscriptions";
import { invoices } from "./schema/invoices";
import { devices } from "./schema/devices";
import { hashPassword } from "../lib/passwords";

async function main() {
  console.log("Seeding database…");

  // Reihenfolge wegen Foreign Keys: erst Kinder löschen, dann Eltern
  await db.delete(invoices);
  await db.delete(subscriptions);
  await db.delete(devices);
  await db.delete(customers);
  await db.delete(users);
  await db.delete(orgs);

  // 1) Demo-Org erstellen
  const [demoOrg] = await db
    .insert(orgs)
    .values({
      name: "Caisty Test Org",
      slug: "caisty-test-org",
    })
    .returning();

  console.log("Created org:", demoOrg.id);

  // 2) Demo-User (Admins) mit Passwort-Hash
  const ownerPasswordHash = await hashPassword("owner123");
  const adminPasswordHash = await hashPassword("admin123");

  const [ownerUser, adminUser] = await db
    .insert(users)
    .values([
      {
        orgId: demoOrg.id,
        email: "owner@caisty.local",
        passwordHash: ownerPasswordHash,
        role: "owner",
      },
      {
        orgId: demoOrg.id,
        email: "admin@caisty.local",
        passwordHash: adminPasswordHash,
        role: "admin",
      },
    ])
    .returning();

  console.log("Created users:", ownerUser.email, adminUser.email);

  // 3) Demo-Customers
  const [customer1, customer2, customer3] = await db
    .insert(customers)
    .values([
      {
        orgId: demoOrg.id,
        name: "Alice GmbH",
        email: "alice@example.com",
        status: "active",
      },
      {
        orgId: demoOrg.id,
        name: "Bob OHG",
        email: "bob@example.com",
        status: "active",
      },
      {
        orgId: demoOrg.id,
        name: "Charlie e.K.",
        email: "charlie@example.com",
        status: "inactive",
      },
    ])
    .returning();

  console.log(
    "Created customers:",
    customer1.email,
    customer2.email,
    customer3.email,
  );

  // 4) Subscriptions
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [sub1, sub2] = await db
    .insert(subscriptions)
    .values([
      {
        orgId: demoOrg.id,
        customerId: customer1.id,
        plan: "pro",
        status: "active",
        priceCents: 4999,
        currency: "EUR",
        startedAt: now,
        currentPeriodEnd: in30Days,
      },
      {
        orgId: demoOrg.id,
        customerId: customer2.id,
        plan: "starter",
        status: "active",
        priceCents: 1999,
        currency: "EUR",
        startedAt: now,
        currentPeriodEnd: in30Days,
      },
    ])
    .returning();

  console.log("Created subscriptions:", sub1.id, sub2.id);

  // 5) Invoices
  await db.insert(invoices).values([
    {
      orgId: demoOrg.id,
      customerId: customer1.id,
      subscriptionId: sub1.id,
      number: "INV-2025-0001",
      amountCents: 4999,
      currency: "EUR",
      status: "paid",
      issuedAt: now,
      dueAt: now,
    },
    {
      orgId: demoOrg.id,
      customerId: customer2.id,
      subscriptionId: sub2.id,
      number: "INV-2025-0002",
      amountCents: 1999,
      currency: "EUR",
      status: "open",
      issuedAt: now,
      dueAt: in30Days,
    },
  ]);

  console.log("Created invoices");

  // 6) Devices
  await db.insert(devices).values([
    {
      orgId: demoOrg.id,
      customerId: customer1.id,
      name: "POS Terminal 001",
      type: "pos",
      status: "active",
    },
    {
      orgId: demoOrg.id,
      customerId: customer2.id,
      name: "Tablet 002",
      type: "pos",
      status: "active",
    },
  ]);

  console.log("Created devices");
  console.log("Seeding done.");
}

main()
  .then(() => {
    console.log("Seed script finished.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed script failed:", err);
    process.exit(1);
  });
