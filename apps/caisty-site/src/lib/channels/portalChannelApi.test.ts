import { describe, expect, it } from "vitest";

import { PORTAL_CHANNEL_SLUG_RE, emptyChannelForm } from "./portalChannelApi";

describe("portalChannelApi helpers", () => {
  it("validates POS slug regex", () => {
    expect(PORTAL_CHANNEL_SLUG_RE.test("uber")).toBe(true);
    expect(PORTAL_CHANNEL_SLUG_RE.test("a")).toBe(false);
    expect(PORTAL_CHANNEL_SLUG_RE.test("Bad")).toBe(false);
  });

  it("provides default status mapping keys", () => {
    const form = emptyChannelForm();
    expect(form.statusMapping).toMatchObject({
      created: "",
      accepted: "",
      ready: "",
      dispatched: "",
      delivered: "",
      canceled: "",
    });
  });
});
