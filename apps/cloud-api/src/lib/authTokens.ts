import crypto from "node:crypto";

/** 32-byte random token (hex) for email links. */
export function generateAuthToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** SHA-256 hash — store only this in the database. */
export function hashAuthToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
