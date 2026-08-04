import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const drizzleDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../drizzle",
);

const lifecycleSql = readFileSync(
  join(drizzleDir, "029_device_approval_lifecycle.sql"),
  "utf8",
);

const businessSql = readFileSync(
  join(drizzleDir, "030_business_max_devices_five.sql"),
  "utf8",
);

describe("029_device_approval_lifecycle migration", () => {
  it("adds nullable lifecycle columns with text pending_license_id FK", () => {
    expect(lifecycleSql).toContain("pending_license_id TEXT REFERENCES licenses(id) ON DELETE SET NULL");
    expect(lifecycleSql).toContain("approved_at TIMESTAMPTZ");
    expect(lifecycleSql).toContain("blocked_at TIMESTAMPTZ");
    expect(lifecycleSql).toContain("rejected_at TIMESTAMPTZ");
  });

  it("does not backfill or rewrite existing device statuses", () => {
    expect(lifecycleSql.toLowerCase()).not.toContain("update devices");
    expect(lifecycleSql.toLowerCase()).not.toContain("set status");
  });

  it("does not introduce a status CHECK constraint", () => {
    expect(lifecycleSql.toLowerCase()).not.toContain("check (");
    expect(lifecycleSql.toLowerCase()).not.toContain("constraint");
  });

  it("creates seat, pending, and customer-scoped fingerprint indexes", () => {
    expect(lifecycleSql).toContain("idx_devices_seat_by_license");
    expect(lifecycleSql).toContain("status IN ('active', 'blocked')");
    expect(lifecycleSql).toContain("idx_devices_pending_license");
    expect(lifecycleSql).toContain("idx_devices_fingerprint_customer");
    expect(lifecycleSql).toContain("customer_id, fingerprint");
  });

  it("avoids global fingerprint uniqueness", () => {
    expect(lifecycleSql.toLowerCase()).not.toContain("unique");
  });
});

describe("030_business_max_devices_five migration", () => {
  it("sets business NULL licenses to 5 only", () => {
    expect(businessSql).toContain("lower(plan) = 'business'");
    expect(businessSql).toContain("max_devices IS NULL");
    expect(businessSql).toContain("max_devices = 5");
  });

  it("does not auto-release or block devices", () => {
    expect(businessSql.toLowerCase()).not.toContain("update devices");
    expect(businessSql.toLowerCase()).not.toContain("delete from devices");
  });

  it("does not overwrite non-null business overrides", () => {
    expect(businessSql).not.toContain("max_devices <> 5");
    expect(businessSql).not.toContain("max_devices != 5");
  });
});
