import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../drizzle/026_pos_shifts.sql",
);

describe("026_pos_shifts migration", () => {
  const sql = readFileSync(migrationPath, "utf8");

  it("renames legacy opened_at schema when present", () => {
    expect(sql).toContain("pos_shifts_legacy_pre_53b");
    expect(sql).toContain("business_date DATE NOT NULL");
  });
});
