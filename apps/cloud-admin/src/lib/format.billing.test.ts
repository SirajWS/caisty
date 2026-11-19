import { describe, expect, it } from "vitest";
import { formatMoney } from "./format";

describe("admin SaaS billing money (unchanged)", () => {
  it("still treats invoice amounts as cents / 100", () => {
    expect(formatMoney(1999, "EUR")).toMatch(/19[,.]99/);
    expect(formatMoney(1000, "TND")).toMatch(/10[,.]00/);
  });
});
