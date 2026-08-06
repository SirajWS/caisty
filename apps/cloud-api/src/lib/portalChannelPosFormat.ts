import { randomUUID } from "node:crypto";

import {
  findForbiddenOrgFieldPath,
  findSecretFieldPath,
  normalizeChannelSlug,
  sanitizeChannelUpsertPayload,
  type SanitizedChannelUpsert,
} from "../posSync/channelPayload.js";

/** POS slug rule used by portal forms. */
export const PORTAL_CHANNEL_SLUG_RE = /^[a-z0-9_-]{2,}$/;

export const MAX_IMPORT_CHANNELS = 100;
export const MAX_IMPORT_JSON_BYTES = 512 * 1024;

const POS_SECRET_TOP_LEVEL = new Set(["apikey", "apisecret", "webhooksecret"]);

export type PosImportParseResult =
  | {
      ok: true;
      channels: Record<string, unknown>[];
      strippedSecretPaths: string[];
    }
  | { ok: false; code: string; error: string; index?: number };

export type PortalChannelPublicConfig = {
  providerType?: string | null;
  providerName?: string | null;
  apiBaseUrl?: string | null;
  webhookUrlHint?: string | null;
  pusher?: {
    appKey?: string | null;
    cluster?: string | null;
    channel?: string | null;
  };
  ack?: {
    enabled?: boolean;
    timeoutSec?: number;
  };
};

export type PortalChannelResponse = {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  provider: string | null;
  providerType: string | null;
  providerName: string | null;
  mode: string | null;
  storeId: string | null;
  logoDataUrl: string | null;
  notes: string | null;
  statusMapping: Record<string, unknown>;
  publicSettings: PortalChannelPublicConfig;
  webhookPath: string;
  secrets: {
    apiKey: { configured: boolean };
    apiSecret: { configured: boolean };
    webhookSecret: { configured: boolean };
  };
  deleted: boolean;
  deletedAt: string | null;
  clientUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (lower === "true" || lower === "active" || lower === "enabled") return true;
    if (lower === "false" || lower === "inactive" || lower === "disabled") return false;
  }
  return fallback;
}

export function isValidPortalChannelSlug(slug: string): boolean {
  return PORTAL_CHANNEL_SLUG_RE.test(slug.trim());
}

export function buildWebhookPath(slug: string): string {
  return `/webhooks/channels/${slug}`;
}

function isDirectPosChannelEntry(entry: Record<string, unknown>): boolean {
  return (
    readString(entry.slug) != null ||
    readString(entry.name) != null ||
    typeof entry.id === "string"
  );
}

/** Canonical POS import entry is a direct channel object; `{ channel }` is a tolerant alias. */
export function extractPosImportChannelEntry(
  entry: Record<string, unknown>,
): Record<string, unknown> | null {
  if (isDirectPosChannelEntry(entry)) {
    return entry;
  }

  const wrapped = asObject(entry.channel);
  return wrapped;
}

export function parsePosChannelImportPayload(
  raw: unknown,
): PosImportParseResult {
  if (raw == null || raw === "") {
    return { ok: false, code: "empty_file", error: "Import file is empty." };
  }

  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, code: "invalid_json", error: "Invalid JSON." };
    }
  }

  if (!Array.isArray(parsed)) {
    return {
      ok: false,
      code: "not_array",
      error: "Import must be a JSON array.",
    };
  }

  if (parsed.length === 0) {
    return {
      ok: false,
      code: "empty_array",
      error: "Import array must not be empty.",
    };
  }

  if (parsed.length > MAX_IMPORT_CHANNELS) {
    return {
      ok: false,
      code: "too_many_channels",
      error: `Import exceeds maximum of ${MAX_IMPORT_CHANNELS} channels.`,
    };
  }

  const channels: Record<string, unknown>[] = [];
  const strippedSecretPaths: string[] = [];

  for (let i = 0; i < parsed.length; i += 1) {
    const entry = parsed[i];
    if (entry == null || typeof entry !== "object" || Array.isArray(entry)) {
      return {
        ok: false,
        code: "invalid_entry",
        error: `Entry at index ${i} must be an object.`,
        index: i,
      };
    }

    const wrapper = entry as Record<string, unknown>;
    const channelObj = extractPosImportChannelEntry(wrapper);
    if (!channelObj) {
      return {
        ok: false,
        code: "invalid_entry",
        error: `Entry at index ${i} must be a channel object.`,
        index: i,
      };
    }

    const forbidden = findForbiddenOrgFieldPath(channelObj);
    if (forbidden) {
      return {
        ok: false,
        code: "forbidden_field",
        error: `Entry at index ${i}: field "${forbidden}" is not allowed.`,
        index: i,
      };
    }

    const secretPathPrefix = isDirectPosChannelEntry(wrapper)
      ? `[${i}]`
      : `[${i}].channel`;
    const stripped = stripPosSecrets(channelObj, secretPathPrefix);
    strippedSecretPaths.push(...stripped.paths);

    channels.push(stripped.channel);
  }

  return { ok: true, channels, strippedSecretPaths };
}

function stripPosSecrets(
  channel: Record<string, unknown>,
  prefix: string,
): { channel: Record<string, unknown>; paths: string[] } {
  const clone: Record<string, unknown> = structuredClone(channel);
  const paths: string[] = [];

  for (const key of Object.keys(clone)) {
    const normalized = key.trim().toLowerCase().replace(/[\s_.-]+/g, "");
    if (POS_SECRET_TOP_LEVEL.has(normalized)) {
      paths.push(`${prefix}.${key}`);
      delete clone[key];
    }
  }

  return { channel: clone, paths };
}

export function extractPublicConfig(
  configJson: unknown,
): PortalChannelPublicConfig {
  const root = asObject(configJson) ?? {};
  const pusher = asObject(root.pusher);
  const ack = asObject(root.ack);

  return {
    providerType: readString(root.providerType),
    providerName: readString(root.providerName),
    apiBaseUrl: readString(root.apiBaseUrl),
    webhookUrlHint: readString(root.webhookUrlHint),
    pusher: pusher
      ? {
          appKey: readString(pusher.appKey ?? pusher.pusherKey),
          cluster: readString(pusher.cluster),
          channel: readString(pusher.channel),
        }
      : undefined,
    ack: ack
      ? {
          enabled: readBool(ack.enabled, false),
          timeoutSec:
            typeof ack.timeoutSec === "number" && Number.isFinite(ack.timeoutSec)
              ? ack.timeoutSec
              : undefined,
        }
      : undefined,
  };
}

export function buildPublicConfigJson(input: {
  providerType?: string | null;
  providerName?: string | null;
  apiBaseUrl?: string | null;
  webhookUrlHint?: string | null;
  pusherAppKey?: string | null;
  pusherCluster?: string | null;
  pusherChannel?: string | null;
  ackEnabled?: boolean;
  ackTimeoutSec?: number | null;
}): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  if (input.providerType) config.providerType = input.providerType;
  if (input.providerName) config.providerName = input.providerName;
  if (input.apiBaseUrl) config.apiBaseUrl = input.apiBaseUrl;
  if (input.webhookUrlHint) config.webhookUrlHint = input.webhookUrlHint;

  const pusher: Record<string, unknown> = {};
  if (input.pusherAppKey) pusher.appKey = input.pusherAppKey;
  if (input.pusherCluster) pusher.cluster = input.pusherCluster;
  if (input.pusherChannel) pusher.channel = input.pusherChannel;
  if (Object.keys(pusher).length > 0) config.pusher = pusher;

  if (input.ackEnabled != null || input.ackTimeoutSec != null) {
    config.ack = {
      enabled: input.ackEnabled ?? false,
      ...(input.ackTimeoutSec != null ? { timeoutSec: input.ackTimeoutSec } : {}),
    };
  }

  return config;
}

export function posChannelObjectToSyncPayload(
  channel: Record<string, unknown>,
): Record<string, unknown> {
  const providerType =
    readString(channel.providerType) ??
    readString(channel.type) ??
    readString(channel.kind);
  const providerName = readString(channel.providerName);
  const provider =
    readString(channel.provider) ?? providerName ?? providerType;

  const storeId =
    readString(channel.providerStoreId) ??
    readString(channel.storeId) ??
    readString(channel.storeid);

  const statusMapping =
    asObject(channel.statusMap) ??
    asObject(channel.statusMapping) ??
    asObject(channel.statusmapping) ??
    {};

  const pusherRaw = asObject(channel.pusher);
  const ackRaw = asObject(channel.ack);

  const publicSettings = buildPublicConfigJson({
    providerType,
    providerName,
    apiBaseUrl: readString(channel.apiBaseUrl),
    webhookUrlHint: readString(channel.webhookUrlHint),
    pusherAppKey: pusherRaw
      ? readString(pusherRaw.appKey ?? pusherRaw.pusherKey)
      : readString(channel.pusherKey),
    pusherCluster: pusherRaw ? readString(pusherRaw.cluster) : null,
    pusherChannel: pusherRaw ? readString(pusherRaw.channel) : null,
    ackEnabled: ackRaw ? readBool(ackRaw.enabled, false) : undefined,
    ackTimeoutSec:
      ackRaw && typeof ackRaw.timeoutSec === "number"
        ? ackRaw.timeoutSec
        : null,
  });

  return {
    name: readString(channel.name) ?? "",
    slug: readString(channel.slug) ?? "",
    enabled: readBool(channel.enabled, true),
    provider,
    mode: readString(channel.mode),
    storeId,
    statusMapping,
    notes: readString(channel.notes),
    logoDataUrl: readString(channel.logoDataUrl),
    publicSettings,
  };
}

export type PortalChannelWriteInput = {
  name: string;
  slug: string;
  enabled: boolean;
  providerType?: string | null;
  provider?: string | null;
  providerName?: string | null;
  mode?: string | null;
  storeId?: string | null;
  logoDataUrl?: string | null;
  notes?: string | null;
  statusMapping?: Record<string, unknown>;
  apiBaseUrl?: string | null;
  webhookUrlHint?: string | null;
  pusherAppKey?: string | null;
  pusherCluster?: string | null;
  pusherChannel?: string | null;
  ackEnabled?: boolean;
  ackTimeoutSec?: number | null;
};

export function portalWriteInputToSyncPayload(
  input: PortalChannelWriteInput,
): Record<string, unknown> {
  const provider =
    readString(input.provider) ??
    readString(input.providerName) ??
    readString(input.providerType);

  return {
    name: input.name.trim(),
    slug: input.slug.trim(),
    enabled: input.enabled,
    provider,
    mode: readString(input.mode),
    storeId: readString(input.storeId),
    statusMapping: input.statusMapping ?? {},
    notes: readString(input.notes),
    logoDataUrl: readString(input.logoDataUrl),
    publicSettings: buildPublicConfigJson({
      providerType: readString(input.providerType),
      providerName: readString(input.providerName),
      apiBaseUrl: readString(input.apiBaseUrl),
      webhookUrlHint: readString(input.webhookUrlHint),
      pusherAppKey: readString(input.pusherAppKey),
      pusherCluster: readString(input.pusherCluster),
      pusherChannel: readString(input.pusherChannel),
      ackEnabled: input.ackEnabled,
      ackTimeoutSec: input.ackTimeoutSec ?? null,
    }),
  };
}

export function validatePortalWriteInput(
  input: PortalChannelWriteInput,
):
  | { ok: true }
  | { ok: false; code: string; error: string; field?: string } {
  if (!input.name?.trim()) {
    return { ok: false, code: "validation_error", error: "Display name is required.", field: "name" };
  }

  const slug = input.slug?.trim() ?? "";
  if (!slug) {
    return { ok: false, code: "validation_error", error: "Slug is required.", field: "slug" };
  }
  if (!isValidPortalChannelSlug(slug)) {
    return {
      ok: false,
      code: "validation_error",
      error: "Slug must match /^[a-z0-9_-]{2,}$/.",
      field: "slug",
    };
  }
  const normalized = normalizeChannelSlug(slug);
  if (!normalized || normalized !== slug.toLowerCase()) {
    return {
      ok: false,
      code: "validation_error",
      error: "Slug must use lowercase letters, numbers, underscores, or hyphens.",
      field: "slug",
    };
  }

  const providerType = readString(input.providerType);
  const provider = readString(input.provider);
  const providerName = readString(input.providerName);
  if (!providerType && !provider && !providerName) {
    return {
      ok: false,
      code: "validation_error",
      error: "Provider type or provider name is required.",
      field: "providerType",
    };
  }

  if (input.ackEnabled && (input.ackTimeoutSec == null || input.ackTimeoutSec < 1)) {
    return {
      ok: false,
      code: "validation_error",
      error: "ACK timeout must be at least 1 second when ACK is enabled.",
      field: "ackTimeoutSec",
    };
  }

  const mode = readString(input.mode)?.toLowerCase();
  const type = (providerType ?? provider ?? "").toLowerCase();
  if (
    mode === "realtime" ||
    type.includes("pusher") ||
    input.pusherAppKey ||
    input.pusherCluster ||
    input.pusherChannel
  ) {
    if (!readString(input.pusherAppKey)) {
      return {
        ok: false,
        code: "validation_error",
        error: "Pusher app key is required for realtime channels.",
        field: "pusherAppKey",
      };
    }
    if (!readString(input.pusherCluster)) {
      return {
        ok: false,
        code: "validation_error",
        error: "Pusher cluster is required for realtime channels.",
        field: "pusherCluster",
      };
    }
    if (!readString(input.pusherChannel)) {
      return {
        ok: false,
        code: "validation_error",
        error: "Pusher channel is required for realtime channels.",
        field: "pusherChannel",
      };
    }
  }

  return { ok: true };
}

export function sanitizePortalChannelWrite(
  input: PortalChannelWriteInput,
):
  | { ok: true; sanitized: SanitizedChannelUpsert }
  | { ok: false; code: string; error: string; field?: string } {
  const basic = validatePortalWriteInput(input);
  if (!basic.ok) return basic;

  const syncPayload = portalWriteInputToSyncPayload(input);
  const secretPath = findSecretFieldPath(syncPayload);
  if (secretPath) {
    return {
      ok: false,
      code: "secret_field_rejected",
      error: `Field "${secretPath}" is not allowed.`,
    };
  }

  const sanitized = sanitizeChannelUpsertPayload(syncPayload);
  if (!sanitized.ok) {
    return sanitized;
  }

  return sanitized;
}

export function dbRowToPortalChannel(row: {
  id: string;
  slug: string;
  name: string;
  enabled: boolean;
  provider: string | null;
  mode: string | null;
  storeId: string | null;
  statusMapping: unknown;
  notes: string | null;
  logoDataUrl: string | null;
  configJson: unknown;
  deletedAt: Date | null;
  clientUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): PortalChannelResponse {
  const publicSettings = extractPublicConfig(row.configJson);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    enabled: row.enabled,
    provider: row.provider,
    providerType: publicSettings.providerType ?? row.provider,
    providerName: publicSettings.providerName ?? row.provider,
    mode: row.mode,
    storeId: row.storeId,
    logoDataUrl: row.logoDataUrl,
    notes: row.notes,
    statusMapping:
      row.statusMapping &&
      typeof row.statusMapping === "object" &&
      !Array.isArray(row.statusMapping)
        ? (row.statusMapping as Record<string, unknown>)
        : {},
    publicSettings,
    webhookPath: buildWebhookPath(row.slug),
    secrets: {
      apiKey: { configured: false },
      apiSecret: { configured: false },
      webhookSecret: { configured: false },
    },
    deleted: row.deletedAt != null,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    clientUpdatedAt: row.clientUpdatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function dbRowToPosExportChannel(row: {
  id: string;
  slug: string;
  name: string;
  enabled: boolean;
  provider: string | null;
  mode: string | null;
  storeId: string | null;
  statusMapping: unknown;
  notes: string | null;
  logoDataUrl: string | null;
  configJson: unknown;
}): Record<string, unknown> {
  const publicSettings = extractPublicConfig(row.configJson);
  const channel: Record<string, unknown> = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    enabled: row.enabled,
  };

  if (publicSettings.providerType) channel.providerType = publicSettings.providerType;
  if (row.provider) channel.provider = row.provider;
  if (publicSettings.providerName) channel.providerName = publicSettings.providerName;
  if (row.mode) channel.mode = row.mode;
  if (row.storeId) channel.providerStoreId = row.storeId;
  if (row.logoDataUrl) channel.logoDataUrl = row.logoDataUrl;
  if (row.notes) channel.notes = row.notes;
  if (publicSettings.apiBaseUrl) channel.apiBaseUrl = publicSettings.apiBaseUrl;
  if (publicSettings.webhookUrlHint) channel.webhookUrlHint = publicSettings.webhookUrlHint;

  const statusMapping =
    row.statusMapping &&
    typeof row.statusMapping === "object" &&
    !Array.isArray(row.statusMapping)
      ? row.statusMapping
      : {};
  if (Object.keys(statusMapping as object).length > 0) {
    channel.statusMap = statusMapping;
  }

  if (publicSettings.pusher) {
    const pusher: Record<string, unknown> = {};
    if (publicSettings.pusher.appKey) pusher.appKey = publicSettings.pusher.appKey;
    if (publicSettings.pusher.cluster) pusher.cluster = publicSettings.pusher.cluster;
    if (publicSettings.pusher.channel) pusher.channel = publicSettings.pusher.channel;
    if (Object.keys(pusher).length > 0) channel.pusher = pusher;
  }

  if (publicSettings.ack) {
    channel.ack = {
      enabled: publicSettings.ack.enabled ?? false,
      ...(publicSettings.ack.timeoutSec != null
        ? { timeoutSec: publicSettings.ack.timeoutSec }
        : {}),
    };
  }

  return channel;
}

/** @deprecated Alias kept for legacy wrapper-oriented tests; export uses direct objects. */
export function dbRowToPosExportEntry(row: Parameters<typeof dbRowToPosExportChannel>[0]): {
  channel: Record<string, unknown>;
} {
  return { channel: dbRowToPosExportChannel(row) };
}

export function resolveImportChannelId(channel: Record<string, unknown>): string {
  const raw = readString(channel.id);
  if (raw) {
    return raw;
  }
  return randomUUID();
}
