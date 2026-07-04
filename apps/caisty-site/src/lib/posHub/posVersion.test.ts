import { describe, expect, it } from "vitest";
import {
  compareSemver,
  isUpdateAvailable,
  pickHighestSemver,
} from "./posVersion";

describe("posVersion", () => {
  it("compares semver tuples", () => {
    expect(compareSemver("0.3.0", "0.3.1")).toBe(-1);
    expect(compareSemver("0.3.1", "0.3.1")).toBe(0);
    expect(compareSemver("1.0.0", "0.9.9")).toBe(1);
  });

  it("detects update when installed is older", () => {
    expect(isUpdateAvailable("0.3.0", "0.3.1")).toBe(true);
    expect(isUpdateAvailable("0.3.1", "0.3.1")).toBe(false);
    expect(isUpdateAvailable(null, "0.3.1")).toBe(false);
  });

  it("picks highest installed version from devices", () => {
    expect(pickHighestSemver(["0.3.0", "0.3.1", null])).toBe("0.3.1");
    expect(pickHighestSemver([null, undefined])).toBeNull();
  });
});
