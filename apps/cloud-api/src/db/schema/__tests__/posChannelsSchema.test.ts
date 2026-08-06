import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { posChannels } from "../posChannels.js";

const migrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../drizzle/032_pos_channels.sql",
);

describe("posChannels schema", () => {
  it("allows nullable source_device_id in drizzle schema", () => {
    expect(posChannels.sourceDeviceId.notNull).toBe(false);
  });

  it("migration uses ON DELETE SET NULL for source_device_id", () => {
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toContain("source_device_id UUID REFERENCES devices(id) ON DELETE SET NULL");
  });
});
