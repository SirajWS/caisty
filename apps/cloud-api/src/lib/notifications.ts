import { db } from "../db/client.js";
import { notifications } from "../db/schema/notifications.js";

export async function createNotification(input: {
  orgId: string;
  type: string;
  title: string;
  body?: string;
  customerId?: string | null;
  licenseId?: string | null;
  data?: any;
}) {
  const [row] = await db
    .insert(notifications)
    .values({
      orgId: input.orgId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      customerId: input.customerId ?? null,
      licenseId: input.licenseId ?? null,
      data: input.data ?? null,
    })
    .returning();
  return row;
}
