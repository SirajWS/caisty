import { describe, expect, it } from "vitest";

import { buildOrdersPdfFilename, buildReportsPdfFilename } from "./index";
import { sanitizeFilenamePart } from "./formatters";

describe("document export filenames", () => {
  it("sanitizes unsafe filename parts", () => {
    expect(sanitizeFilenamePart("This week")).toBe("this-week");
    expect(sanitizeFilenamePart("7 days / test")).toBe("7-days-test");
  });

  it("builds stable report and order filenames", () => {
    const generatedAt = new Date("2026-07-08T12:00:00.000Z");

    expect(buildReportsPdfFilename("Today", generatedAt)).toBe(
      "caisty-reports-today-2026-07-08.pdf",
    );
    expect(buildOrdersPdfFilename(generatedAt, "Today")).toBe(
      "caisty-orders-today-2026-07-08.pdf",
    );
  });
});
