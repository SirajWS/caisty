import { eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { businessProfiles } from "../db/schema/businessProfiles.js";
import { isSupportedBusinessCurrency } from "../../../../packages/business-currency/src/index.ts";

type LockTx = {
  select: typeof db.select;
  update: typeof db.update;
};

export function isBusinessCurrencyLocked(
  row: { currencyLockedAt?: Date | null } | null | undefined,
): boolean {
  return Boolean(row?.currencyLockedAt);
}

export function businessCurrencyNeedsReview(
  currency: string | null | undefined,
): boolean {
  return !isSupportedBusinessCurrency(currency);
}

export function currencyLockError(message: string) {
  return {
    ok: false as const,
    error: "currency_locked" as const,
    message,
  };
}

export async function lockBusinessCurrencyIfNeeded(
  orgId: string,
  tx: LockTx = db,
): Promise<
  | { ok: true; lockedAt: Date | null }
  | { ok: false; code: "BUSINESS_CURRENCY_INVALID"; message: string }
> {
  const [row] = await tx
    .select({
      currency: businessProfiles.currency,
      currencyLockedAt: businessProfiles.currencyLockedAt,
    })
    .from(businessProfiles)
    .where(eq(businessProfiles.orgId, orgId))
    .for("update")
    .limit(1);

  if (!row) {
    return {
      ok: false,
      code: "BUSINESS_CURRENCY_INVALID",
      message: "Complete business setup before activating a POS device.",
    };
  }

  if (!isSupportedBusinessCurrency(row.currency)) {
    return {
      ok: false,
      code: "BUSINESS_CURRENCY_INVALID",
      message:
        "Business currency is missing or unsupported. Set a valid currency before activating POS.",
    };
  }

  if (row.currencyLockedAt) {
    return { ok: true, lockedAt: row.currencyLockedAt };
  }

  const now = new Date();
  const [updated] = await tx
    .update(businessProfiles)
    .set({
      currencyLockedAt: now,
      updatedAt: now,
    })
    .where(eq(businessProfiles.orgId, orgId))
    .returning({ currencyLockedAt: businessProfiles.currencyLockedAt });

  return { ok: true, lockedAt: updated?.currencyLockedAt ?? now };
}
