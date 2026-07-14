import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../drizzle/025_pos_receipt_events.sql",
);

describe("025_pos_receipt_events migration", () => {
  const sql = readFileSync(migrationPath, "utf8");

  it("creates append-only pos_receipt_events table with required columns", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS pos_receipt_events/i);
    expect(sql).toContain("event_id UUID NOT NULL");
    expect(sql).toContain("event_type VARCHAR(32) NOT NULL");
    expect(sql).toContain("occurred_at TIMESTAMPTZ NOT NULL");
    expect(sql).toContain("payload JSONB NOT NULL DEFAULT '{}'::jsonb");
    expect(sql).toContain("schema_version INTEGER NOT NULL DEFAULT 1");
    expect(sql).toContain("sync_batch_id UUID");
    expect(sql).toContain("receipt_id UUID NOT NULL REFERENCES pos_receipts(id)");
  });

  it("defines unique event_id and org-scoped indexes", () => {
    expect(sql).toContain("uq_pos_receipt_events_event_id");
    expect(sql).toContain("idx_pos_receipt_events_org_receipt");
    expect(sql).toContain("idx_pos_receipt_events_org_occurred_at");
    expect(sql).toContain("idx_pos_receipt_events_org_event_type");
  });
});
