// apps/api/src/config/license.ts

// Standard offline grace period for POS licenses (in days).
// Kann per ENV überschrieben werden: OFFLINE_GRACE_DAYS=10 z.B.
export const OFFLINE_GRACE_DAYS: number =
  Number(process.env.OFFLINE_GRACE_DAYS || "7");
