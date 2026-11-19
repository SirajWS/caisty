import { describe, expect, it } from "vitest";
import { formatMinorUnits } from "./format";

describe("formatMinorUnits", () => {
  it("formats supported catalogs without silent EUR fallback", () => {
    expect(formatMinorUnits(1312, "EUR", "en-GB")).toContain("13.12");
    expect(formatMinorUnits(13125, "TND", "en-GB")).toContain("13.125");
    expect(formatMinorUnits(13125, "LYD", "en-GB")).toContain("13.125");
    expect(formatMinorUnits(1312, "CHF", "en-GB")).toContain("13.12");
  });

  it("keeps unknown historical codes visible without crashing", () => {
    expect(formatMinorUnits(600, "XYZ", "en-GB")).toBe("600 XYZ");
    expect(formatMinorUnits(600, "", "en-GB")).toBe("600");
  });
});
