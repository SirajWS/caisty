import crypto from "node:crypto";
import type { IdempotencyResult } from "./types";

// TODO: passe Imports an dein Projekt an
// import { db } from "../db";
// import { idempotencyKeys } from "../db/schema";

export class IdempotencyService {
  constructor(private readonly opts: { ttlSeconds?: number } = {}) {}

  static hash(payload: unknown) {
    const json = JSON.stringify(payload ?? {});
    return crypto.createHash("sha256").update(json).digest("hex");
  }

  async get<T>(key: string, requestHash: string): Promise<IdempotencyResult<T>> {
    // TODO: DB lookup in idempotency_keys by key
    // - wenn exists & request_hash != requestHash => 409 conflict
    // - wenn exists & response_json vorhanden => return hit:true

    return { hit: false };
  }

  async set<T>(key: string, requestHash: string, value: T): Promise<void> {
    // TODO: upsert idempotency_keys:
    // key, request_hash, response_json, created_at, updated_at
  }
}

