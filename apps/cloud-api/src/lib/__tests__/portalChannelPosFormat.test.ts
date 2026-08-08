import { describe, expect, it } from "vitest";

import {
  dbRowToPosExportChannel,
  parsePosChannelImportPayload,
  posChannelObjectToSyncPayload,
  validatePortalWriteInput,
} from "../portalChannelPosFormat.js";

describe("portalChannelPosFormat", () => {
  it("rejects empty import file", () => {
    expect(parsePosChannelImportPayload("")).toMatchObject({ ok: false, code: "empty_file" });
  });

  it("rejects invalid json", () => {
    expect(parsePosChannelImportPayload("{")).toMatchObject({ ok: false, code: "invalid_json" });
  });

  it("rejects non-array import", () => {
    expect(parsePosChannelImportPayload({ channels: {} })).toMatchObject({
      ok: false,
      code: "not_array",
    });
  });

  it("rejects empty array import", () => {
    expect(parsePosChannelImportPayload([])).toMatchObject({
      ok: false,
      code: "empty_array",
    });
  });

  it("rejects null/primitive entries", () => {
    expect(parsePosChannelImportPayload([null])).toMatchObject({
      ok: false,
      code: "invalid_entry",
      index: 0,
    });
  });

  it("accepts direct POS array (canonical) and strips secrets", () => {
    const result = parsePosChannelImportPayload([
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Fake Provider",
        slug: "postman",
        provider: "other",
        enabled: true,
        providerType: "delivery_app",
        apiKey: "secret-key",
        statusMap: { created: "new" },
      },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.strippedSecretPaths).toContain("[0].apiKey");
      expect(result.channels[0].apiKey).toBeUndefined();
      expect(result.channels[0].name).toBe("Fake Provider");
      expect(result.channels[0].slug).toBe("postman");
    }
  });

  it("accepts wrapped channel alias and strips secrets with wrapper path", () => {
    const result = parsePosChannelImportPayload([
      {
        channel: {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Uber",
          slug: "uber",
          enabled: true,
          providerType: "uber",
          apiKey: "secret-key",
          statusMap: { created: "new" },
        },
      },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.strippedSecretPaths).toContain("[0].channel.apiKey");
      expect(result.channels[0].apiKey).toBeUndefined();
    }
  });

  it("reports index for invalid direct entry", () => {
    expect(parsePosChannelImportPayload([{}, { name: "X", slug: "x" }])).toMatchObject({
      ok: false,
      code: "invalid_entry",
      index: 0,
    });
  });

  it("rejects orgId in direct import entry", () => {
    const result = parsePosChannelImportPayload([
      { orgId: "bad", name: "X", slug: "x", provider: "other" },
    ]);
    expect(result).toMatchObject({ ok: false, code: "forbidden_field", index: 0 });
  });

  it("preserves public POS fields from direct entry", () => {
    const result = parsePosChannelImportPayload([
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Fake Provider (Postman)",
        slug: "postman",
        provider: "other",
        providerType: "delivery_app",
        enabled: true,
        mode: "realtime",
        providerStoreId: "store-1",
        notes: "Test channel",
        statusMap: { created: "new" },
        pusher: { appKey: "pk", cluster: "eu", channel: "orders" },
        ack: { enabled: true, timeoutSec: 30 },
      },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.channels[0]).toMatchObject({
        name: "Fake Provider (Postman)",
        slug: "postman",
        provider: "other",
        providerType: "delivery_app",
        mode: "realtime",
        providerStoreId: "store-1",
        notes: "Test channel",
      });
    }
  });

  it("maps legacy aliases into sync payload", () => {
    const payload = posChannelObjectToSyncPayload({
      name: "Lieferando",
      slug: "lieferando",
      enabled: true,
      type: "delivery",
      providerName: "Lieferando",
      storeId: "store-1",
      statusMap: { ready: "accepted" },
      pusherKey: "pk_test",
      ack: { enabled: true, timeoutSec: 30 },
    });

    expect(payload.provider).toBe("Lieferando");
    expect(payload.storeId).toBe("store-1");
    expect(payload.publicSettings).toMatchObject({
      providerType: "delivery",
      providerName: "Lieferando",
      pusher: { appKey: "pk_test" },
      ack: { enabled: true, timeoutSec: 30 },
    });
  });

  it("exports direct channel objects without wrapper, secrets, or orgId", () => {
    const entry = dbRowToPosExportChannel({
      id: "11111111-1111-1111-1111-111111111111",
      slug: "uber",
      name: "Uber",
      enabled: true,
      provider: "uber",
      mode: "realtime",
      storeId: "store-1",
      statusMapping: { created: "new" },
      notes: "Main",
      logoDataUrl: null,
      configJson: {
        providerType: "uber",
        providerName: "Uber Eats",
        pusher: { appKey: "pk", cluster: "eu", channel: "orders" },
      },
    });

    expect(entry).not.toHaveProperty("channel");
    expect(entry.id).toBe("11111111-1111-1111-1111-111111111111");
    expect(entry.statusMap).toEqual({ created: "new" });
    expect(entry.apiKey).toBeUndefined();
    expect(entry.orgId).toBeUndefined();
  });

  it("validates portal slug rule and ack timeout", () => {
    expect(
      validatePortalWriteInput({
        name: "Test",
        slug: "A",
        enabled: true,
        providerType: "uber",
      }).ok,
    ).toBe(false);

    expect(
      validatePortalWriteInput({
        name: "Test",
        slug: "uber_eats",
        enabled: true,
        providerType: "uber",
        ackEnabled: true,
        ackTimeoutSec: 0,
      }).ok,
    ).toBe(false);
  });
});
