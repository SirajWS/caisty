import { describe, expect, it } from "vitest";

import { decideShiftUpsert } from "../shiftUpsertLogic.js";
import { SHIFT_STATUS } from "../shiftTypes.js";

describe("decideShiftUpsert", () => {
  it("inserts when no existing shift", () => {
    expect(
      decideShiftUpsert(null, { status: SHIFT_STATUS.OPEN }),
    ).toEqual({ action: "insert" });
  });

  it("treats duplicate open as idempotent", () => {
    expect(
      decideShiftUpsert(
        { status: SHIFT_STATUS.OPEN },
        { status: SHIFT_STATUS.OPEN },
      ),
    ).toEqual({ action: "duplicate" });
  });

  it("closes an existing open shift", () => {
    expect(
      decideShiftUpsert(
        { status: SHIFT_STATUS.OPEN },
        { status: SHIFT_STATUS.CLOSED },
      ),
    ).toEqual({ action: "update_close" });
  });

  it("treats duplicate close as idempotent", () => {
    expect(
      decideShiftUpsert(
        { status: SHIFT_STATUS.CLOSED },
        { status: SHIFT_STATUS.CLOSED },
      ),
    ).toEqual({ action: "duplicate" });
  });

  it("prevents closed to open regression", () => {
    expect(
      decideShiftUpsert(
        { status: SHIFT_STATUS.CLOSED },
        { status: SHIFT_STATUS.OPEN },
      ),
    ).toEqual({ action: "reject_closed_to_open" });
  });
});
