import {
  clearPortalToken,
  getStoredPortalToken,
  PortalAuthError,
} from "../portalApi";

const RAW_API_BASE = import.meta.env.VITE_CLOUD_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3333" : "https://api.caisty.com");
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export class PortalChannelApiError extends Error {
  readonly code?: string;
  readonly field?: string;
  readonly status?: number;

  constructor(message: string, opts?: { code?: string; field?: string; status?: number }) {
    super(message);
    this.name = "PortalChannelApiError";
    this.code = opts?.code;
    this.field = opts?.field;
    this.status = opts?.status;
  }
}

async function portalAuthFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getStoredPortalToken();
  if (!token) {
    throw new PortalAuthError("Not signed in.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text
    ? (JSON.parse(text) as T & { message?: string; code?: string; field?: string })
    : ({} as T & { message?: string; code?: string; field?: string });

  if (res.status === 401) {
    clearPortalToken();
    throw new PortalAuthError(data.message ?? "Session expired.");
  }

  if (!res.ok) {
    throw new PortalChannelApiError(data.message ?? `Request failed (${res.status}).`, {
      code: data.code,
      field: data.field,
      status: res.status,
    });
  }

  return data;
}

export type PortalChannelSecrets = {
  apiKey: { configured: boolean };
  apiSecret: { configured: boolean };
  webhookSecret: { configured: boolean };
};

export type PortalChannelPublicSettings = {
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

export type PortalChannel = {
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
  publicSettings: PortalChannelPublicSettings;
  secrets: PortalChannelSecrets;
  deleted: boolean;
  deletedAt: string | null;
  clientUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PortalChannelWriteBody = {
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

export type PortalImportPreview = {
  ok: true;
  added: number;
  updated: number;
  unchanged: number;
  keptExisting: number;
};

export type PortalImportPreviewFailure = {
  ok: false;
  message: string;
};

function readImportId(entry: Record<string, unknown>): string | null {
  const raw = entry.id;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function readImportSlug(entry: Record<string, unknown>): string | null {
  const raw = entry.slug;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed && PORTAL_CHANNEL_SLUG_RE.test(trimmed) ? trimmed : null;
}

export function previewPortalChannelImport(
  existing: PortalChannel[],
  incoming: unknown[],
): PortalImportPreview | PortalImportPreviewFailure {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return { ok: false, message: "Import must be a non-empty JSON array." };
  }

  const byId = new Map(existing.map((c) => [c.id, c]));
  const bySlug = new Map(existing.map((c) => [c.slug, c]));
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  let added = 0;
  let updated = 0;
  let unchanged = 0;
  const touchedIds = new Set<string>();

  for (const raw of incoming) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { ok: false, message: "One or more channel entries are invalid." };
    }
    const entry = raw as Record<string, unknown>;
    const id = readImportId(entry);
    const slug = readImportSlug(entry);
    if (!slug) {
      return { ok: false, message: "Each channel must include a valid slug." };
    }
    if (id) {
      if (seenIds.has(id)) {
        return { ok: false, message: "Import contains duplicate channel IDs." };
      }
      seenIds.add(id);
    }
    if (seenSlugs.has(slug)) {
      return { ok: false, message: "Import contains duplicate channel slugs." };
    }
    seenSlugs.add(slug);

    const slugOwner = bySlug.get(slug);
    if (slugOwner && (!id || slugOwner.id !== id)) {
      return {
        ok: false,
        message: `Slug "${slug}" is already used by "${slugOwner.name}" (${slugOwner.id}).`,
      };
    }

    const match = id ? byId.get(id) : undefined;
    if (match) {
      const name = typeof entry.name === "string" ? entry.name.trim() : match.name;
      if (name === match.name && slug === match.slug) {
        unchanged += 1;
      } else {
        updated += 1;
      }
      touchedIds.add(match.id);
    } else {
      added += 1;
      if (id) touchedIds.add(id);
    }
  }

  const keptExisting = existing.filter((c) => !touchedIds.has(c.id)).length;
  return { ok: true, added, updated, unchanged, keptExisting };
}

export async function fetchPortalChannels(): Promise<PortalChannel[]> {
  const data = await portalAuthFetch<{ ok: boolean; channels?: PortalChannel[] }>(
    "/portal/channels",
  );
  return data.channels ?? [];
}

export async function createPortalChannel(
  body: PortalChannelWriteBody,
): Promise<PortalChannel> {
  const data = await portalAuthFetch<{ ok: boolean; channel?: PortalChannel }>(
    "/portal/channels",
    { method: "POST", body: JSON.stringify(body) },
  );
  if (!data.channel) throw new PortalChannelApiError("Create failed.");
  return data.channel;
}

export async function updatePortalChannel(
  id: string,
  body: PortalChannelWriteBody,
): Promise<PortalChannel> {
  const data = await portalAuthFetch<{ ok: boolean; channel?: PortalChannel }>(
    `/portal/channels/${id}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  if (!data.channel) throw new PortalChannelApiError("Update failed.");
  return data.channel;
}

export async function setPortalChannelEnabled(
  id: string,
  enabled: boolean,
): Promise<PortalChannel> {
  const data = await portalAuthFetch<{ ok: boolean; channel?: PortalChannel }>(
    `/portal/channels/${id}`,
    { method: "PATCH", body: JSON.stringify({ enabled }) },
  );
  if (!data.channel) throw new PortalChannelApiError("Update failed.");
  return data.channel;
}

export async function deletePortalChannel(id: string): Promise<void> {
  await portalAuthFetch<{ ok: boolean }>(`/portal/channels/${id}`, {
    method: "DELETE",
  });
}

export async function importPortalChannelsMerge(
  channels: unknown[],
): Promise<{
  channels: PortalChannel[];
  added: number;
  updated: number;
  unchanged: number;
  keptExisting: number;
  secretImportNotice: string;
}> {
  const data = await portalAuthFetch<{
    ok: boolean;
    channels?: PortalChannel[];
    added?: number;
    updated?: number;
    unchanged?: number;
    keptExisting?: number;
    secretImportNotice?: string;
  }>("/portal/channels/import", {
    method: "POST",
    body: JSON.stringify({ merge: true, channels }),
  });
  if (!data.channels) throw new PortalChannelApiError("Import failed.");
  return {
    channels: data.channels,
    added: data.added ?? 0,
    updated: data.updated ?? 0,
    unchanged: data.unchanged ?? 0,
    keptExisting: data.keptExisting ?? 0,
    secretImportNotice: data.secretImportNotice ?? "Import completed.",
  };
}

/** @deprecated Use importPortalChannelsMerge. */
export async function importPortalChannelsReplace(
  channels: unknown[],
): Promise<{ channels: PortalChannel[]; secretImportNotice: string }> {
  const result = await importPortalChannelsMerge(channels);
  return {
    channels: result.channels,
    secretImportNotice: result.secretImportNotice,
  };
}

export async function downloadPortalChannelsExport(): Promise<Blob> {
  const token = getStoredPortalToken();
  if (!token) throw new PortalChannelApiError("Not signed in.", { status: 401 });

  const res = await fetch(`${API_BASE}/portal/channels/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearPortalToken();
    throw new PortalChannelApiError("Session expired.", { status: 401 });
  }
  if (!res.ok) {
    throw new PortalChannelApiError("Export failed.", { status: res.status });
  }

  return res.blob();
}

export const PORTAL_CHANNEL_SLUG_RE = /^[a-z0-9_-]{2,}$/;

export function channelToFormValues(channel: PortalChannel): PortalChannelWriteBody {
  const ps = channel.publicSettings ?? {};
  return {
    name: channel.name,
    slug: channel.slug,
    enabled: channel.enabled,
    providerType: ps.providerType ?? channel.providerType,
    provider: channel.provider,
    providerName: ps.providerName ?? channel.providerName,
    mode: channel.mode,
    storeId: channel.storeId,
    logoDataUrl: channel.logoDataUrl,
    notes: channel.notes,
    statusMapping: channel.statusMapping ?? {},
    apiBaseUrl: ps.apiBaseUrl ?? null,
    webhookUrlHint: ps.webhookUrlHint ?? null,
    pusherAppKey: ps.pusher?.appKey ?? null,
    pusherCluster: ps.pusher?.cluster ?? null,
    pusherChannel: ps.pusher?.channel ?? null,
    ackEnabled: ps.ack?.enabled ?? false,
    ackTimeoutSec: ps.ack?.timeoutSec ?? 30,
  };
}

export function emptyChannelForm(): PortalChannelWriteBody {
  return {
    name: "",
    slug: "",
    enabled: true,
    providerType: "",
    provider: "",
    providerName: "",
    mode: "",
    storeId: "",
    logoDataUrl: "",
    notes: "",
    statusMapping: {
      created: "",
      accepted: "",
      ready: "",
      dispatched: "",
      delivered: "",
      canceled: "",
    },
    apiBaseUrl: "",
    webhookUrlHint: "",
    pusherAppKey: "",
    pusherCluster: "",
    pusherChannel: "",
    ackEnabled: false,
    ackTimeoutSec: 30,
  };
}
