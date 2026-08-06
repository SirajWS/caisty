import { describe, expect, it } from "vitest";

import { portalEn } from "../translations/portal/en";

describe("portal channels navigation i18n", () => {
  it("includes Channels under business navigation labels", () => {
    expect(portalEn.layout.navChannels).toBe("Channels");
    expect(portalEn.layout.navSectionBusiness).toBe("Business");
    expect(portalEn.channels.title).toBe("Channels");
  });
});
