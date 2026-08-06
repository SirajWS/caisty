/**
 * Channel sync payload validation, allowlist, secret rejection, and size limits.
 * Logo limit applies to decoded binary payload (base64), not the data-URL prefix.
 */

/** Decoded logo binary cap — aligned with realistic POS channel logos. */
export const CHANNEL_LOGO_MAX_BYTES = 250 * 1024;

/** Short text fields — enough for display names and provider identifiers. */
export const CHANNEL_NAME_MAX_CHARS = 200;
export const CHANNEL_SLUG_MAX_CHARS = 100;
export const CHANNEL_PROVIDER_MAX_CHARS = 100;
export const CHANNEL_MODE_MAX_CHARS = 32;
export const CHANNEL_STORE_ID_MAX_CHARS = 256;

/** Notes — public free text, bounded to protect DB and batch payloads. */
export const CHANNEL_NOTES_MAX_CHARS = 4_000;

/** JSON blobs — statusMapping/publicSettings; 16 KiB keeps realistic maps small. */
export const CHANNEL_JSON_MAX_BYTES = 16 * 1024;
export const CHANNEL_JSON_MAX_DEPTH = 8;
export const CHANNEL_JSON_MAX_KEYS = 64;
export const CHANNEL_JSON_MAX_ARRAY_LENGTH = 128;

const CHANNEL_SECRET_FIELD_NAMES = new Set([
  "apikey",
  "apisecret",
  "webhooksecret",
  "accesstoken",
  "refreshtoken",
  "password",
  "privatekey",
  "pushersecret",
  "clientsecret",
  "secret",
  "token",
  "credentials",
]);

const CHANNEL_FORBIDDEN_ORG_FIELD_NAMES = new Set([
  "orgid",
  "organizationid",
  "tenantid",
]);

const CHANNEL_UNSAFE_PROTOTYPE_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
]);

export const CHANNEL_UPSERT_FIELD_ALLOWLIST = new Set([
  "name",
  "slug",
  "enabled",
  "status",
  "provider",
  "mode",
  "storeid",
  "statusmapping",
  "notes",
  "logodataurl",
  "publicsettings",
  "createdat",
  "providerstoreid",
  "statusmap",
]);

const LOGO_DATA_URL_RE =
  /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=\s]+$/i;

export type SanitizedChannelUpsert = {
  name: string;
  slug: string;
  normalizedSlug: string;
  enabled: boolean;
  provider: string | null;
  mode: string | null;
  storeId: string | null;
  statusMapping: Record<string, unknown>;
  notes: string | null;
  logoDataUrl: string | null;
  configJson: Record<string, unknown>;
  schemaVersion: number;
};

export type ChannelPayloadValidationResult =
  | { ok: true; sanitized: SanitizedChannelUpsert }
  | { ok: false; code: string; error: string };

export function normalizeChannelSlug(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  const normalized = trimmed
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]+/g, "")
    .replace(/_+/g, "_")
    .replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized : null;
}

/** Lowercase and strip separators so api_key, api-key and apiKey match. */
export function normalizeSensitiveFieldKey(key: string): string {
  return key.trim().toLowerCase().replace(/[\s_.-]+/g, "");
}

function normalizeAllowlistFieldKey(key: string): string {
  return key.trim().toLowerCase();
}

function isUnsafePrototypeKey(key: string): boolean {
  return CHANNEL_UNSAFE_PROTOTYPE_KEYS.has(key.trim().toLowerCase());
}

export function findForbiddenOrgFieldPath(
  value: unknown,
  path = "",
  seen: WeakSet<object> = new WeakSet(),
): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (seen.has(value as object)) {
    return path || "(circular)";
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const nested = findForbiddenOrgFieldPath(value[i], `${path}[${i}]`, seen);
      if (nested) return nested;
    }
    return null;
  }

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (isUnsafePrototypeKey(key)) {
      return path ? `${path}.${key}` : key;
    }
    const fieldPath = path ? `${path}.${key}` : key;
    const normalized = normalizeSensitiveFieldKey(key);
    if (CHANNEL_FORBIDDEN_ORG_FIELD_NAMES.has(normalized)) {
      return fieldPath;
    }
    const deeper = findForbiddenOrgFieldPath(nested, fieldPath, seen);
    if (deeper) return deeper;
  }

  return null;
}

export function findSecretFieldPath(
  value: unknown,
  path = "",
  seen: WeakSet<object> = new WeakSet(),
): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (seen.has(value as object)) {
    return path || "(circular)";
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const nested = findSecretFieldPath(value[i], `${path}[${i}]`, seen);
      if (nested) return nested;
    }
    return null;
  }

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (isUnsafePrototypeKey(key)) {
      return path ? `${path}.${key}` : key;
    }
    const fieldPath = path ? `${path}.${key}` : key;
    const normalized = normalizeSensitiveFieldKey(key);
    if (CHANNEL_SECRET_FIELD_NAMES.has(normalized)) {
      return fieldPath;
    }
    const deeper = findSecretFieldPath(nested, fieldPath, seen);
    if (deeper) return deeper;
  }

  return null;
}

function jsonByteLength(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function validateJsonStructure(
  value: unknown,
  label: string,
): ChannelPayloadValidationResult | null {
  if (value == null) {
    return null;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return {
      ok: false,
      code: "invalid_payload",
      error: `${label} must be a JSON object.`,
    };
  }

  const bytes = jsonByteLength(value);
  if (bytes > CHANNEL_JSON_MAX_BYTES) {
    return {
      ok: false,
      code: "payload_too_large",
      error: `${label} exceeds ${CHANNEL_JSON_MAX_BYTES} bytes.`,
    };
  }

  const depthError = validateJsonDepth(value, label, 1, new WeakSet());
  if (depthError) return depthError;

  return null;
}

function validateJsonDepth(
  value: unknown,
  label: string,
  depth: number,
  seen: WeakSet<object>,
): ChannelPayloadValidationResult | null {
  if (depth > CHANNEL_JSON_MAX_DEPTH) {
    return {
      ok: false,
      code: "payload_too_deep",
      error: `${label} exceeds maximum nesting depth of ${CHANNEL_JSON_MAX_DEPTH}.`,
    };
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  if (seen.has(value as object)) {
    return {
      ok: false,
      code: "invalid_payload",
      error: `${label} contains a circular structure.`,
    };
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    if (value.length > CHANNEL_JSON_MAX_ARRAY_LENGTH) {
      return {
        ok: false,
        code: "payload_too_large",
        error: `${label} array exceeds ${CHANNEL_JSON_MAX_ARRAY_LENGTH} entries.`,
      };
    }
    for (const item of value) {
      const nested = validateJsonDepth(item, label, depth + 1, seen);
      if (nested) return nested;
    }
    return null;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > CHANNEL_JSON_MAX_KEYS) {
    return {
      ok: false,
      code: "payload_too_large",
      error: `${label} exceeds ${CHANNEL_JSON_MAX_KEYS} keys.`,
    };
  }

  for (const [key, nested] of entries) {
    if (isUnsafePrototypeKey(key)) {
      return {
        ok: false,
        code: "forbidden_field",
        error: `Field "${key}" is not allowed in channel sync payloads.`,
      };
    }
    const nestedError = validateJsonDepth(nested, label, depth + 1, seen);
    if (nestedError) return nestedError;
  }

  return null;
}

function assertMaxLength(
  value: string,
  max: number,
  field: string,
): ChannelPayloadValidationResult | null {
  if (value.length > max) {
    return {
      ok: false,
      code: "payload_too_large",
      error: `${field} exceeds ${max} characters.`,
    };
  }
  return null;
}

export function validateLogoDataUrl(
  value: unknown,
): ChannelPayloadValidationResult | null {
  if (value == null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    return {
      ok: false,
      code: "invalid_logo_data_url",
      error: "logoDataUrl must be a string data URL or null.",
    };
  }

  const trimmed = value.trim();
  if (!LOGO_DATA_URL_RE.test(trimmed)) {
    return {
      ok: false,
      code: "invalid_logo_data_url",
      error:
        "logoDataUrl must be a base64 image data URL (png, jpeg, gif, or webp).",
    };
  }

  const base64Part = trimmed.split(",")[1]?.replace(/\s/g, "") ?? "";
  let decodedLength = 0;
  try {
    decodedLength = Buffer.from(base64Part, "base64").byteLength;
  } catch {
    return {
      ok: false,
      code: "invalid_logo_data_url",
      error: "logoDataUrl base64 payload is invalid.",
    };
  }

  if (decodedLength > CHANNEL_LOGO_MAX_BYTES) {
    return {
      ok: false,
      code: "logo_data_url_too_large",
      error: `logoDataUrl decoded image exceeds ${CHANNEL_LOGO_MAX_BYTES} bytes.`,
    };
  }

  return null;
}

function parseEnabled(payload: Record<string, unknown>): boolean {
  if (typeof payload.enabled === "boolean") {
    return payload.enabled;
  }
  if (typeof payload.status === "string") {
    const status = payload.status.trim().toLowerCase();
    if (status === "disabled" || status === "inactive" || status === "deleted") {
      return false;
    }
    if (status === "active" || status === "enabled") {
      return true;
    }
  }
  return true;
}

function normalizeMode(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

function readOptionalString(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableJson(obj[k])}`).join(",")}}`;
}

function resolveStoreId(
  payload: Record<string, unknown>,
): ChannelPayloadValidationResult | { ok: true; value: string | null } {
  const canonical = readOptionalString(payload.storeId ?? payload.storeid);
  const legacy = readOptionalString(
    payload.providerStoreId ?? payload.providerstoreid,
  );

  if (canonical && legacy && canonical !== legacy) {
    return {
      ok: false,
      code: "conflicting_fields",
      error: "storeId and providerStoreId disagree.",
    };
  }

  return { ok: true, value: canonical ?? legacy ?? null };
}

function resolveStatusMapping(
  payload: Record<string, unknown>,
): ChannelPayloadValidationResult | { ok: true; value: Record<string, unknown> } {
  const canonical = payload.statusMapping ?? payload.statusmapping;
  const legacy = payload.statusMap ?? payload.statusmap;

  const hasCanonical =
    canonical != null &&
    typeof canonical === "object" &&
    !Array.isArray(canonical);
  const hasLegacy =
    legacy != null && typeof legacy === "object" && !Array.isArray(legacy);

  if (hasCanonical && hasLegacy) {
    if (stableJson(canonical) !== stableJson(legacy)) {
      return {
        ok: false,
        code: "conflicting_fields",
        error: "statusMapping and statusMap disagree.",
      };
    }
  }

  const raw = hasCanonical ? canonical : hasLegacy ? legacy : {};
  if (
    raw != null &&
    (typeof raw !== "object" || Array.isArray(raw))
  ) {
    return {
      ok: false,
      code: "invalid_payload",
      error: "statusMapping must be a JSON object.",
    };
  }

  return { ok: true, value: (raw as Record<string, unknown>) ?? {} };
}

export function sanitizeChannelUpsertPayload(
  payload: Record<string, unknown>,
): ChannelPayloadValidationResult {
  const forbiddenPath = findForbiddenOrgFieldPath(payload);
  if (forbiddenPath) {
    return {
      ok: false,
      code: "forbidden_field",
      error: `Field "${forbiddenPath}" is not allowed in channel sync payloads.`,
    };
  }

  const secretPath = findSecretFieldPath(payload);
  if (secretPath) {
    return {
      ok: false,
      code: "secret_field_rejected",
      error: `Field "${secretPath}" is not allowed in channel sync payloads.`,
    };
  }

  for (const key of Reflect.ownKeys(payload)) {
    if (typeof key !== "string") {
      return {
        ok: false,
        code: "forbidden_field",
        error: "Channel sync payloads must use string field names.",
      };
    }
    if (isUnsafePrototypeKey(key)) {
      return {
        ok: false,
        code: "forbidden_field",
        error: `Field "${key}" is not allowed in channel sync payloads.`,
      };
    }
    const normalized = normalizeAllowlistFieldKey(key);
    if (
      normalized === "op" ||
      normalized === "channelid" ||
      normalized === "clientupdatedat" ||
      normalized === "entityid" ||
      normalized === "entitytype"
    ) {
      continue;
    }
    if (!CHANNEL_UPSERT_FIELD_ALLOWLIST.has(normalized)) {
      return {
        ok: false,
        code: "invalid_channel_field",
        error: `Field "${key}" is not allowed in channel upsert payloads.`,
      };
    }
  }

  const name =
    typeof payload.name === "string" ? payload.name.trim() : "";
  if (!name) {
    return {
      ok: false,
      code: "invalid_payload",
      error: "name is required for channel upsert.",
    };
  }
  const nameLimit = assertMaxLength(name, CHANNEL_NAME_MAX_CHARS, "name");
  if (nameLimit) return nameLimit;

  const slugRaw =
    typeof payload.slug === "string" ? payload.slug.trim() : "";
  const slugLimit = slugRaw
    ? assertMaxLength(slugRaw, CHANNEL_SLUG_MAX_CHARS, "slug")
    : null;
  if (slugLimit) return slugLimit;

  const normalizedSlug = normalizeChannelSlug(slugRaw);
  if (!normalizedSlug) {
    return {
      ok: false,
      code: "invalid_payload",
      error: "slug is required and must contain valid characters.",
    };
  }

  const provider =
    typeof payload.provider === "string" ? payload.provider.trim() || null : null;
  if (provider) {
    const providerLimit = assertMaxLength(
      provider,
      CHANNEL_PROVIDER_MAX_CHARS,
      "provider",
    );
    if (providerLimit) return providerLimit;
  }

  const mode = normalizeMode(payload.mode);
  if (mode) {
    const modeLimit = assertMaxLength(mode, CHANNEL_MODE_MAX_CHARS, "mode");
    if (modeLimit) return modeLimit;
  }

  const storeIdResult = resolveStoreId(payload);
  if (!storeIdResult.ok) return storeIdResult;
  if (storeIdResult.value) {
    const storeLimit = assertMaxLength(
      storeIdResult.value,
      CHANNEL_STORE_ID_MAX_CHARS,
      "storeId",
    );
    if (storeLimit) return storeLimit;
  }

  const statusMappingResult = resolveStatusMapping(payload);
  if (!statusMappingResult.ok) return statusMappingResult;
  const statusMappingError = validateJsonStructure(
    statusMappingResult.value,
    "statusMapping",
  );
  if (statusMappingError) return statusMappingError;

  const notes =
    typeof payload.notes === "string" ? payload.notes.trim() || null : null;
  if (notes) {
    const notesLimit = assertMaxLength(notes, CHANNEL_NOTES_MAX_CHARS, "notes");
    if (notesLimit) return notesLimit;
  }

  const logoError = validateLogoDataUrl(payload.logoDataUrl ?? payload.logodataurl);
  if (logoError) {
    return logoError;
  }

  const logoRaw = payload.logoDataUrl ?? payload.logodataurl;
  const logoDataUrl =
    typeof logoRaw === "string" && logoRaw.trim() ? logoRaw.trim() : null;

  const publicSettingsRaw = payload.publicSettings ?? payload.publicsettings;
  const publicSettingsError = validateJsonStructure(
    publicSettingsRaw ?? {},
    "publicSettings",
  );
  if (publicSettingsError) return publicSettingsError;

  const publicSettings =
    publicSettingsRaw &&
    typeof publicSettingsRaw === "object" &&
    !Array.isArray(publicSettingsRaw)
      ? (publicSettingsRaw as Record<string, unknown>)
      : {};

  const nestedForbidden = findForbiddenOrgFieldPath(publicSettings, "publicSettings");
  if (nestedForbidden) {
    return {
      ok: false,
      code: "forbidden_field",
      error: `Field "${nestedForbidden}" is not allowed in channel sync payloads.`,
    };
  }

  const nestedSecret = findSecretFieldPath(publicSettings, "publicSettings");
  if (nestedSecret) {
    return {
      ok: false,
      code: "secret_field_rejected",
      error: `Field "${nestedSecret}" is not allowed in channel sync payloads.`,
    };
  }

  return {
    ok: true,
    sanitized: {
      name,
      slug: slugRaw,
      normalizedSlug,
      enabled: parseEnabled(payload),
      provider,
      mode,
      storeId: storeIdResult.value,
      statusMapping: statusMappingResult.value,
      notes,
      logoDataUrl,
      configJson: publicSettings,
      schemaVersion: 1,
    },
  };
}

export function toChannelPullConfig(row: {
  statusMapping: unknown;
  configJson: unknown;
}): {
  statusMapping: Record<string, unknown>;
  publicSettings: Record<string, unknown>;
} {
  return {
    statusMapping:
      row.statusMapping &&
      typeof row.statusMapping === "object" &&
      !Array.isArray(row.statusMapping)
        ? (row.statusMapping as Record<string, unknown>)
        : {},
    publicSettings:
      row.configJson &&
      typeof row.configJson === "object" &&
      !Array.isArray(row.configJson)
        ? (row.configJson as Record<string, unknown>)
        : {},
  };
}
