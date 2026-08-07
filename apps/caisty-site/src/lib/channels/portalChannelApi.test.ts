import { describe, expect, it } from "vitest";

import { channelToFormValues, PORTAL_CHANNEL_SLUG_RE, emptyChannelForm } from "./portalChannelApi";
import type { PortalChannel } from "./portalChannelApi";

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

  it("accepts portal channel API responses without webhookPath", () => {
    const channel: PortalChannel = {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Fake Provider",
      slug: "postman",
      enabled: true,
      provider: "other",
      providerType: "delivery_app",
      providerName: "Fake Provider",
      mode: "realtime",
      storeId: "store-1",
      logoDataUrl: null,
      notes: null,
      statusMapping: { created: "new" },
      publicSettings: {},
      secrets: {
        apiKey: { configured: false },
        apiSecret: { configured: false },
        webhookSecret: { configured: false },
      },
      deleted: false,
      deletedAt: null,
      clientUpdatedAt: "2026-08-06T00:00:00.000Z",
      createdAt: "2026-08-06T00:00:00.000Z",
      updatedAt: "2026-08-06T00:00:00.000Z",
    };

    expect(channel).not.toHaveProperty("webhookPath");
    expect(channelToFormValues(channel).slug).toBe("postman");
  });
});
