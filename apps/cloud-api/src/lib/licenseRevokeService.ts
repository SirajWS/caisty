import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { licenseEvents } from "../db/schema/licenseEvents.js";
import { licenses } from "../db/schema/licenses.js";

export const LICENSE_DELETE_DISABLED = {
  ok: false as const,
  error: "license_delete_disabled",
  message:
    "Hard-delete of licenses is disabled so license history, events and device assignments are preserved. Revoke the license instead.",
};

export type RevokeLicenseResult =
  | {
      ok: true;
      alreadyRevoked: boolean;
      item: typeof licenses.$inferSelect;
    }
  | {
      ok: false;
      code: "not_found";
      message: string;
    };

/**
 * Soft-revoke a license. Does not unbind devices, delete events, or change receipts.
 */
export async function revokeLicense(
  licenseId: string,
  reason?: string,
): Promise<RevokeLicenseResult> {
  const [existing] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.id, licenseId))
    .limit(1);

  if (!existing) {
    return {
      ok: false,
      code: "not_found",
      message: "License not found.",
    };
  }

  if (existing.status === "revoked") {
    return {
      ok: true,
      alreadyRevoked: true,
      item: existing,
    };
  }

  const now = new Date();
  const [updated] = await db
    .update(licenses)
    .set({
      status: "revoked",
      updatedAt: now,
    })
    .where(eq(licenses.id, existing.id))
    .returning();

  const item = updated ?? { ...existing, status: "revoked", updatedAt: now };

  await db.insert(licenseEvents).values({
    orgId: item.orgId,
    licenseId: item.id,
    type: "revoked",
    metadata: reason ? { reason } : null,
  });

  return {
    ok: true,
    alreadyRevoked: false,
    item,
  };
}
