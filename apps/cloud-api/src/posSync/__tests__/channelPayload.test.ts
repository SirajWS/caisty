import { describe, expect, it } from "vitest";

import {
  CHANNEL_JSON_MAX_KEYS,
  CHANNEL_JSON_MAX_BYTES,
  CHANNEL_NAME_MAX_CHARS,
  CHANNEL_NOTES_MAX_CHARS,
  CHANNEL_LOGO_MAX_BYTES,
  findForbiddenOrgFieldPath,
  findSecretFieldPath,
  normalizeChannelSlug,
  normalizeSensitiveFieldKey,
  sanitizeChannelUpsertPayload,
  validateLogoDataUrl,
} from "../channelPayload.js";

const baseUpsert = {
  op: "upsert",
  channelId: "00000000-0000-0000-0000-000000000001",
  clientUpdatedAt: "2026-01-01T00:00:00.000Z",
  name: "Thunder",
  slug: "thunder",
};

const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("normalizeSensitiveFieldKey", () => {
  it("treats separator variants as the same secret key", () => {
    expect(normalizeSensitiveFieldKey("api_key")).toBe("apikey");
    expect(normalizeSensitiveFieldKey("API-KEY")).toBe("apikey");
    expect(normalizeSensitiveFieldKey("api key")).toBe("apikey");
    expect(normalizeSensitiveFieldKey("access_token")).toBe("accesstoken");
    expect(normalizeSensitiveFieldKey("client_secret")).toBe("clientsecret");
  });

  it("does not match harmless compound names", () => {
    expect(findSecretFieldPath({ tokenLabel: "x" })).toBeNull();
    expect(findSecretFieldPath({ secretaryName: "Ann" })).toBeNull();
  });
});

describe("forbidden organization fields", () => {
  it("rejects orgId with forbidden_field", () => {
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      orgId: "00000000-0000-0000-0000-000000000099",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("forbidden_field");
    }
  });

  it("rejects nested tenant_id variants", () => {
    expect(
      findForbiddenOrgFieldPath({ publicSettings: { tenant_id: "x" } }),
    ).toBe("publicSettings.tenant_id");
    expect(
      sanitizeChannelUpsertPayload({
        ...baseUpsert,
        publicSettings: { organizationId: "x" },
      }).ok,
    ).toBe(false);
  });

  it("rejects prototype pollution keys", () => {
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      constructor: { polluted: true },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("forbidden_field");
  });
});

describe("secret field detection", () => {
  it("rejects snake_case and kebab-case secrets", () => {
    for (const key of [
      "api_key",
      "api-secret",
      "access_token",
      "refresh-token",
      "webhook_secret",
      "client_secret",
    ]) {
      const payload = { ...baseUpsert, [key]: "placeholder-value" };
      const result = sanitizeChannelUpsertPayload(payload);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("secret_field_rejected");
    }
  });

  it("rejects nested and array secrets", () => {
    expect(
      sanitizeChannelUpsertPayload({
        ...baseUpsert,
        publicSettings: { nested: { api_secret: "x" } },
      }).ok,
    ).toBe(false);
    expect(findSecretFieldPath({ items: [{ password: "x" }] })).toBe(
      "items[0].password",
    );
  });

  it("rejects private.key as a secret field", () => {
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      publicSettings: { "private.key": "secret-value" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("secret_field_rejected");
  });
});

describe("canonical and legacy aliases", () => {
  it("accepts legacy providerStoreId and statusMap", () => {
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      providerStoreId: "store-1",
      statusMap: { created: "open" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sanitized.storeId).toBe("store-1");
      expect(result.sanitized.statusMapping).toEqual({ created: "open" });
    }
  });

  it("accepts identical canonical and legacy values", () => {
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      storeId: "S1",
      providerStoreId: "S1",
      statusMapping: { a: 1 },
      statusMap: { a: 1 },
    });
    expect(result.ok).toBe(true);
  });

  it("rejects conflicting storeId and providerStoreId", () => {
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      storeId: "A",
      providerStoreId: "B",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("conflicting_fields");
  });

  it("rejects conflicting statusMapping and statusMap", () => {
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      statusMapping: { a: 1 },
      statusMap: { a: 2 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("conflicting_fields");
  });

  it("accepts null and empty string for storeId aliases", () => {
    expect(
      sanitizeChannelUpsertPayload({
        ...baseUpsert,
        storeId: null,
        providerStoreId: "",
      }).ok,
    ).toBe(true);
    expect(
      sanitizeChannelUpsertPayload({
        ...baseUpsert,
        storeId: "",
        providerStoreId: null,
      }).ok,
    ).toBe(true);
  });

  it("treats identical JSON values as equal regardless of key order", () => {
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      statusMapping: { z: 1, a: 2 },
      statusMap: { a: 2, z: 1 },
    });
    expect(result.ok).toBe(true);
  });
});

describe("size and structure limits", () => {
  it("rejects oversized name at limit+1", () => {
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      name: "x".repeat(CHANNEL_NAME_MAX_CHARS + 1),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("payload_too_large");
  });

  it("accepts name at exact limit", () => {
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      name: "x".repeat(CHANNEL_NAME_MAX_CHARS),
    });
    expect(result.ok).toBe(true);
  });

  it("rejects oversized notes", () => {
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      notes: "n".repeat(CHANNEL_NOTES_MAX_CHARS + 1),
    });
    expect(result.ok).toBe(false);
  });

  it("rejects oversized statusMapping json", () => {
    const bigValue = "x".repeat(CHANNEL_JSON_MAX_BYTES);
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      statusMapping: { blob: bigValue },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects excessive nesting depth", () => {
    let nested: Record<string, unknown> = { leaf: true };
    for (let i = 0; i < 12; i += 1) {
      nested = { child: nested };
    }
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      publicSettings: nested,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("payload_too_deep");
  });

  it("rejects circular structures in publicSettings", () => {
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      publicSettings: circular,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("forbidden_field");
  });

  it("accepts exactly 64 JSON keys per object", () => {
    const statusMapping: Record<string, number> = {};
    for (let i = 0; i < CHANNEL_JSON_MAX_KEYS; i += 1) {
      statusMapping[`k${i}`] = i;
    }
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      statusMapping,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects 65 JSON keys per object", () => {
    const statusMapping: Record<string, number> = {};
    for (let i = 0; i < CHANNEL_JSON_MAX_KEYS + 1; i += 1) {
      statusMapping[`k${i}`] = i;
    }
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      statusMapping,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("payload_too_large");
  });
});

describe("slug and logo", () => {
  it("normalizes slugs consistently", () => {
    expect(normalizeChannelSlug(" Lieferando ")).toBe("lieferando");
    expect(normalizeChannelSlug("My Shop")).toBe("my_shop");
  });

  it("allows empty logo and normalizes mode", () => {
    const result = sanitizeChannelUpsertPayload({
      ...baseUpsert,
      logoDataUrl: "",
      mode: "Sandbox",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sanitized.logoDataUrl).toBeNull();
      expect(result.sanitized.mode).toBe("sandbox");
    }
  });

  it("rejects invalid and oversized logos", () => {
    expect(validateLogoDataUrl("not-a-data-url")?.code).toBe("invalid_logo_data_url");
    const big = "data:image/png;base64," + "A".repeat(400_000);
    expect(validateLogoDataUrl(big)?.code).toBe("logo_data_url_too_large");
    expect(validateLogoDataUrl(tinyPng)).toBeNull();
    expect(tinyPng.length).toBeLessThan(CHANNEL_LOGO_MAX_BYTES);
  });
});
