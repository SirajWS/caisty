import crypto from "node:crypto";
import type { IdempotencyResult } from "./types.js";
import { db } from "../db/client.js";
import { idempotencyKeys } from "../db/schema/idempotencyKeys.js";
import { eq, and, gt } from "drizzle-orm";
import { addHours } from "date-fns";

export class IdempotencyService {
  constructor(private readonly opts: { ttlHours?: number } = {}) {}

  static hash(payload: unknown): string {
    const json = JSON.stringify(payload ?? {});
    return crypto.createHash("sha256").update(json).digest("hex");
  }

  async get<T>(key: string, requestHash: string, orgId: string): Promise<IdempotencyResult<T>> {
    const [existing] = await db
      .select()
      .from(idempotencyKeys)
      .where(
        and(
          eq(idempotencyKeys.key, key),
          gt(idempotencyKeys.expiresAt ?? new Date(0), new Date())
        )
      )
      .limit(1);

    if (!existing) {
      return { hit: false };
    }

    // If request hash differs, it's a conflict
    if (existing.requestHash !== requestHash) {
      throw new Error(
        `Idempotency key conflict: key "${key}" exists with different request hash`
      );
    }

    // If response exists, return cached value
    if (existing.responseJson) {
      try {
        const cached = JSON.parse(existing.responseJson) as T;
        return { hit: true, value: cached };
      } catch (err) {
        // Invalid JSON, treat as not found
        return { hit: false };
      }
    }

    // Key exists but no response yet (in progress)
    return { hit: false };
  }

  async set<T>(key: string, requestHash: string, value: T, orgId: string, scope: string): Promise<void> {
    const ttlHours = this.opts.ttlHours ?? 24;
    const expiresAt = addHours(new Date(), ttlHours);
    const responseJson = JSON.stringify(value);

    try {
      // Try to insert
      await db.insert(idempotencyKeys).values({
        key,
        orgId,
        scope,
        requestHash,
        responseJson,
        expiresAt,
      });
    } catch (err: any) {
      // If unique constraint violation, update existing
      if (err.code === "23505") {
        await db
          .update(idempotencyKeys)
          .set({
            responseJson,
            requestHash, // Update hash in case it changed
          })
          .where(eq(idempotencyKeys.key, key));
      } else {
        throw err;
      }
    }
  }
}
