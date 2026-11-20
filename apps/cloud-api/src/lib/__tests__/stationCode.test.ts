import { describe, expect, it } from "vitest";

import {
  formatStationCode,
  parseStationReceiptNumber,
  parseStationSequence,
} from "../stationCode.js";

describe("station codes", () => {
  it("formats K01 through K100 without collision", () => {
    expect(formatStationCode(1)).toBe("K01");
    expect(formatStationCode(2)).toBe("K02");
    expect(formatStationCode(99)).toBe("K99");
    expect(formatStationCode(100)).toBe("K100");
  });

  it("parses station sequences", () => {
    expect(parseStationSequence("K01")).toBe(1);
    expect(parseStationSequence("K100")).toBe(100);
    expect(parseStationSequence("web")).toBeNull();
  });

  it("parses the B5 receipt number format", () => {
    expect(parseStationReceiptNumber("R20261119-K01-0001")).toEqual({
      date: "20261119",
      stationCode: "K01",
      sequence: "0001",
    });
    expect(parseStationReceiptNumber("R20261119-K100-0001")?.stationCode).toBe(
      "K100",
    );
    expect(parseStationReceiptNumber("R20261119-0001")).toBeNull();
    expect(parseStationReceiptNumber("R20261119-K1-0001")).toBeNull();
    expect(parseStationReceiptNumber("R20261119-K01-001")).toBeNull();
  });
});
