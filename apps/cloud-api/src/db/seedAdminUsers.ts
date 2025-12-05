// apps/cloud-api/src/db/seedAdminUsers.ts
import { db } from "./client.js";
import { adminUsers, adminPermissions } from "./schema/index.js";
import { hashPassword } from "../lib/passwords.js";

async function main() {
  console.log("Seeding admin users…");

  // Initiales Passwort für alle Admin-User
  const initialPassword = "CaistyAdmin123!";
  const passwordHash = await hashPassword(initialPassword);

  // 1) Superadmin: siraj@caisty.com
  const [siraj] = await db
    .insert(adminUsers)
    .values({
      email: "siraj@caisty.com",
      name: "Siraj Bettaieb",
      passwordHash,
      role: "superadmin",
      isActive: true,
    })
    .onConflictDoUpdate({
      target: adminUsers.email,
      set: {
        name: "Siraj Bettaieb",
        passwordHash,
        role: "superadmin",
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning();

  console.log("Created/updated superadmin:", siraj.email);

  // 2) Admin: admin@caisty.com
  const [admin] = await db
    .insert(adminUsers)
    .values({
      email: "admin@caisty.com",
      name: "Admin User",
      passwordHash,
      role: "admin",
      isActive: true,
    })
    .onConflictDoUpdate({
      target: adminUsers.email,
      set: {
        name: "Admin User",
        passwordHash,
        role: "admin",
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning();

  console.log("Created/updated admin:", admin.email);

  // 3) Support: support@caisty.com
  const [support] = await db
    .insert(adminUsers)
    .values({
      email: "support@caisty.com",
      name: "Support User",
      passwordHash,
      role: "support",
      isActive: true,
    })
    .onConflictDoUpdate({
      target: adminUsers.email,
      set: {
        name: "Support User",
        passwordHash,
        role: "support",
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning();

  console.log("Created/updated support:", support.email);

  // 4) Permissions für Admin (Standard-Berechtigungen)
  await db
    .insert(adminPermissions)
    .values({
      adminUserId: admin.id,
      canManageCustomers: true,
      canManageSubscriptions: true,
      canManageInvoices: true,
      canAccessTechnicalSettings: false,
    })
    .onConflictDoUpdate({
      target: adminPermissions.adminUserId,
      set: {
        canManageCustomers: true,
        canManageSubscriptions: true,
        canManageInvoices: true,
        canAccessTechnicalSettings: false,
        updatedAt: new Date(),
      },
    });

  // 5) Permissions für Support (eingeschränkte Berechtigungen)
  await db
    .insert(adminPermissions)
    .values({
      adminUserId: support.id,
      canManageCustomers: true,
      canManageSubscriptions: false,
      canManageInvoices: false,
      canAccessTechnicalSettings: false,
    })
    .onConflictDoUpdate({
      target: adminPermissions.adminUserId,
      set: {
        canManageCustomers: true,
        canManageSubscriptions: false,
        canManageInvoices: false,
        canAccessTechnicalSettings: false,
        updatedAt: new Date(),
      },
    });

  // Superadmin hat alle Permissions (wird in Middleware geprüft, nicht in DB)
  console.log("Created/updated permissions");
  console.log("\n✅ Admin users seeded successfully!");
  console.log(`\nInitial password for all users: ${initialPassword}`);
  console.log("\nUsers:");
  console.log(`  - ${siraj.email} (superadmin)`);
  console.log(`  - ${admin.email} (admin)`);
  console.log(`  - ${support.email} (support)`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed script failed:", err);
    process.exit(1);
  });

