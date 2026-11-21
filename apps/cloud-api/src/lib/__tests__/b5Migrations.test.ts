import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const drizzleDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../drizzle",
);

const sql = readFileSync(
  join(drizzleDir, "035_device_station_code.sql"),
  "utf8",
);

const archiveSql = readFileSync(
  join(drizzleDir, "036_device_archived_at.sql"),
  "utf8",
);

describe("B5 drizzle SQL discovery", () => {
  it("follows 033/034 as numbered SQL 035", () => {
    const files = readdirSync(drizzleDir).filter((name) => name.endsWith(".sql"));
    expect(files).toContain("034_business_currency_locked_at.sql");
    expect(files).toContain("035_device_station_code.sql");
    expect(files.indexOf("034_business_currency_locked_at.sql")).toBeLessThan(
      files.indexOf("035_device_station_code.sql"),
    );
  });

  it("is non-destructive and excludes legacy receipt numbers from uniqueness", () => {
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS station_code");
    expect(sql).toContain("org_station_counters");
    expect(sql).toContain("uq_pos_receipts_org_station_receipt_number");
    expect(sql).toContain("^R[0-9]{8}-K[0-9]{2,}-[0-9]{4}$");
    expect(sql).toContain("devices_station_code_write_once");
    expect(sql).toContain("IF NOT EXISTS");
    expect(sql).toContain("GREATEST(");
    expect(sql).toContain("AND d.station_code IS NULL");
    expect(sql.toLowerCase()).not.toContain("drop table");
    expect(sql.toLowerCase()).not.toContain("update pos_receipts");
  });
});

describe("A1.1 archive migration 036", () => {
  it("adds archived_at without deleting device rows or station codes", () => {
    const files = readdirSync(drizzleDir).filter((name) => name.endsWith(".sql"));
    expect(files).toContain("036_device_archived_at.sql");
    expect(files.indexOf("035_device_station_code.sql")).toBeLessThan(
      files.indexOf("036_device_archived_at.sql"),
    );
    expect(archiveSql).toContain("ADD COLUMN IF NOT EXISTS archived_at");
    expect(archiveSql.toLowerCase()).not.toContain("drop table");
    expect(archiveSql.toLowerCase()).not.toContain("drop column");
    expect(archiveSql.toLowerCase()).not.toContain("delete from devices");
    expect(archiveSql).not.toContain("DROP INDEX");
    expect(sql).toContain("uq_devices_org_station_code");
  });
});
