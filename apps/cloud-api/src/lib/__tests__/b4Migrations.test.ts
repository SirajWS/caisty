import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const drizzleDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../drizzle",
);

const quantitySql = readFileSync(
  join(drizzleDir, "033_pos_order_lines_quantity_numeric.sql"),
  "utf8",
);
const lockSql = readFileSync(
  join(drizzleDir, "034_business_currency_locked_at.sql"),
  "utf8",
);

describe("B4 drizzle SQL discovery", () => {
  it("keeps numbered SQL files as the versioned migration registry", () => {
    const files = readdirSync(drizzleDir).filter((name) => name.endsWith(".sql"));
    expect(files).toContain("033_pos_order_lines_quantity_numeric.sql");
    expect(files).toContain("034_business_currency_locked_at.sql");
    expect(files.indexOf("033_pos_order_lines_quantity_numeric.sql")).toBeLessThan(
      files.indexOf("034_business_currency_locked_at.sql"),
    );
  });

  it("033 is idempotent and preserves integer quantities as numeric(12,3)", () => {
    expect(quantitySql).toContain("NUMERIC(12, 3)");
    expect(quantitySql).toContain("USING quantity::numeric(12, 3)");
    expect(quantitySql).toContain("IF EXISTS");
    expect(quantitySql.toLowerCase()).not.toContain("drop table");
    expect(quantitySql.toLowerCase()).not.toContain("truncate");
  });

  it("034 adds write-once lock timestamp without changing currency values", () => {
    expect(lockSql).toContain("ADD COLUMN IF NOT EXISTS currency_locked_at TIMESTAMPTZ");
    expect(lockSql).toContain("SET currency_locked_at = NOW()");
    expect(lockSql).not.toMatch(/SET[\s\S]*currency\s*=/i);
    expect(lockSql.toLowerCase()).not.toContain("drop table");
  });
});
