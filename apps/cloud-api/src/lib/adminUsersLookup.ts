import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { adminUsers, type AdminUser } from "../db/schema/adminUsers.js";

export async function loadActiveAdminUser(
  adminUserId: string,
): Promise<AdminUser | null> {
  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, adminUserId))
    .limit(1);

  if (!admin || !admin.isActive) return null;
  return admin;
}
