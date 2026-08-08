import { randomUUID } from "node:crypto";

import { and, asc, eq, isNull, ne } from "drizzle-orm";

import { db } from "../db/client.js";
import { posChannels } from "../db/schema/posChannels.js";
import {
  dbRowToPortalChannel,
  dbRowToPosExportChannel,
  parsePosChannelImportPayload,
  posChannelObjectToSyncPayload,
  resolveImportChannelId,
  sanitizePortalChannelWrite,
  type PortalChannelResponse,
  type PortalChannelWriteInput,
} from "./portalChannelPosFormat.js";
import { sanitizeChannelUpsertPayload } from "../posSync/channelPayload.js";

export type PortalChannelActor = {
  customerId: string;
  orgId: string;
};

export type PortalChannelFailure = {
  ok: false;
  code: string;
  message: string;
  field?: string;
  index?: number;
};

export type PortalChannelSuccess<T> = {
  ok: true;
  data: T;
};

export type PortalChannelResult<T> = PortalChannelSuccess<T> | PortalChannelFailure;

function failure(
  code: string,
  message: string,
  extra?: { field?: string; index?: number },
): PortalChannelFailure {
  return { ok: false, code, message, ...extra };
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

export async function listPortalChannels(
  actor: PortalChannelActor,
): Promise<PortalChannelResponse[]> {
  const rows = await db
    .select()
    .from(posChannels)
    .where(
      and(eq(posChannels.orgId, actor.orgId), isNull(posChannels.deletedAt)),
    )
    .orderBy(asc(posChannels.updatedAt), asc(posChannels.id));

  return rows.map(dbRowToPortalChannel);
}

export async function getPortalChannel(
  actor: PortalChannelActor,
  channelId: string,
): Promise<PortalChannelResult<PortalChannelResponse>> {
  const [row] = await db
    .select()
    .from(posChannels)
    .where(and(eq(posChannels.orgId, actor.orgId), eq(posChannels.id, channelId)))
    .limit(1);

  if (!row || row.deletedAt) {
    return failure("CHANNEL_NOT_FOUND", "Channel not found.");
  }

  return { ok: true, data: dbRowToPortalChannel(row) };
}

async function findActiveSlugConflict(
  orgId: string,
  slug: string,
  excludeId?: string,
) {
  const conditions = [
    eq(posChannels.orgId, orgId),
    eq(posChannels.slug, slug),
    isNull(posChannels.deletedAt),
  ];
  if (excludeId) {
    conditions.push(ne(posChannels.id, excludeId));
  }

  const [row] = await db
    .select({ id: posChannels.id })
    .from(posChannels)
    .where(and(...conditions))
    .limit(1);

  return row ?? null;
}

export async function createPortalChannel(
  actor: PortalChannelActor,
  input: PortalChannelWriteInput,
): Promise<PortalChannelResult<PortalChannelResponse>> {
  const sanitized = sanitizePortalChannelWrite(input);
  if (!sanitized.ok) {
    return failure(sanitized.code, sanitized.error, { field: sanitized.field });
  }

  const slugConflict = await findActiveSlugConflict(
    actor.orgId,
    sanitized.sanitized.normalizedSlug,
  );
  if (slugConflict) {
    return failure("CHANNEL_SLUG_CONFLICT", "Slug is already in use.");
  }

  const now = new Date();
  const id = randomUUID();

  try {
    const [row] = await db
      .insert(posChannels)
      .values({
        id,
        orgId: actor.orgId,
        customerId: actor.customerId,
        sourceDeviceId: null,
        slug: sanitized.sanitized.normalizedSlug,
        name: sanitized.sanitized.name,
        enabled: sanitized.sanitized.enabled,
        provider: sanitized.sanitized.provider,
        mode: sanitized.sanitized.mode,
        storeId: sanitized.sanitized.storeId,
        statusMapping: sanitized.sanitized.statusMapping,
        notes: sanitized.sanitized.notes,
        logoDataUrl: sanitized.sanitized.logoDataUrl,
        configJson: sanitized.sanitized.configJson,
        deletedAt: null,
        clientUpdatedAt: now,
        syncBatchId: null,
        schemaVersion: sanitized.sanitized.schemaVersion,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return { ok: true, data: dbRowToPortalChannel(row) };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return failure("CHANNEL_SLUG_CONFLICT", "Slug is already in use.");
    }
    throw err;
  }
}

export async function updatePortalChannel(
  actor: PortalChannelActor,
  channelId: string,
  input: PortalChannelWriteInput,
): Promise<PortalChannelResult<PortalChannelResponse>> {
  const sanitized = sanitizePortalChannelWrite(input);
  if (!sanitized.ok) {
    return failure(sanitized.code, sanitized.error, { field: sanitized.field });
  }

  const [existing] = await db
    .select()
    .from(posChannels)
    .where(and(eq(posChannels.orgId, actor.orgId), eq(posChannels.id, channelId)))
    .limit(1);

  if (!existing || existing.deletedAt) {
    return failure("CHANNEL_NOT_FOUND", "Channel not found.");
  }

  const slugConflict = await findActiveSlugConflict(
    actor.orgId,
    sanitized.sanitized.normalizedSlug,
    channelId,
  );
  if (slugConflict) {
    return failure("CHANNEL_SLUG_CONFLICT", "Slug is already in use.");
  }

  const now = new Date();

  try {
    const [row] = await db
      .update(posChannels)
      .set({
        slug: sanitized.sanitized.normalizedSlug,
        name: sanitized.sanitized.name,
        enabled: sanitized.sanitized.enabled,
        provider: sanitized.sanitized.provider,
        mode: sanitized.sanitized.mode,
        storeId: sanitized.sanitized.storeId,
        statusMapping: sanitized.sanitized.statusMapping,
        notes: sanitized.sanitized.notes,
        logoDataUrl: sanitized.sanitized.logoDataUrl,
        configJson: sanitized.sanitized.configJson,
        deletedAt: null,
        clientUpdatedAt: now,
        updatedAt: now,
      })
      .where(
        and(eq(posChannels.orgId, actor.orgId), eq(posChannels.id, channelId)),
      )
      .returning();

    return { ok: true, data: dbRowToPortalChannel(row) };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return failure("CHANNEL_SLUG_CONFLICT", "Slug is already in use.");
    }
    throw err;
  }
}

export async function deletePortalChannel(
  actor: PortalChannelActor,
  channelId: string,
): Promise<PortalChannelResult<PortalChannelResponse>> {
  const [existing] = await db
    .select()
    .from(posChannels)
    .where(and(eq(posChannels.orgId, actor.orgId), eq(posChannels.id, channelId)))
    .limit(1);

  if (!existing || existing.deletedAt) {
    return failure("CHANNEL_NOT_FOUND", "Channel not found.");
  }

  const now = new Date();
  const [row] = await db
    .update(posChannels)
    .set({
      deletedAt: now,
      enabled: false,
      clientUpdatedAt: now,
      updatedAt: now,
    })
    .where(
      and(eq(posChannels.orgId, actor.orgId), eq(posChannels.id, channelId)),
    )
    .returning();

  return { ok: true, data: dbRowToPortalChannel(row) };
}

export async function exportPortalChannels(
  actor: PortalChannelActor,
): Promise<Array<Record<string, unknown>>> {
  const rows = await db
    .select()
    .from(posChannels)
    .where(
      and(eq(posChannels.orgId, actor.orgId), isNull(posChannels.deletedAt)),
    )
    .orderBy(asc(posChannels.slug), asc(posChannels.id));

  return rows.map(dbRowToPosExportChannel);
}

export async function importPortalChannelsMerge(
  actor: PortalChannelActor,
  rawPayload: unknown,
): Promise<
  PortalChannelResult<{
    channels: PortalChannelResponse[];
    added: number;
    updated: number;
    unchanged: number;
    keptExisting: number;
    strippedSecretPaths: string[];
    secretImportNotice: string;
  }>
> {
  const parsed = parsePosChannelImportPayload(rawPayload);
  if (!parsed.ok) {
    return failure(parsed.code, parsed.error, { index: parsed.index });
  }

  const prepared: Array<{
    id: string;
    sanitized: import("../posSync/channelPayload.js").SanitizedChannelUpsert;
  }> = [];

  for (let i = 0; i < parsed.channels.length; i += 1) {
    const syncPayload = posChannelObjectToSyncPayload(parsed.channels[i]);
    const sanitized = sanitizeChannelUpsertPayload(syncPayload);
    if (!sanitized.ok) {
      return failure(
        sanitized.code,
        `Entry at index ${i}: ${sanitized.error}`,
        { index: i },
      );
    }
    prepared.push({
      id: resolveImportChannelId(parsed.channels[i]),
      sanitized: sanitized.sanitized,
    });
  }

  const importSlugSet = new Set<string>();
  const importIdSet = new Set<string>();
  for (let i = 0; i < prepared.length; i += 1) {
    const slug = prepared[i].sanitized.normalizedSlug;
    const id = prepared[i].id;
    if (importIdSet.has(id)) {
      return failure("duplicate_id", `Duplicate channel id at index ${i}.`, { index: i });
    }
    importIdSet.add(id);
    if (importSlugSet.has(slug)) {
      return failure(
        "CHANNEL_SLUG_CONFLICT",
        `Duplicate slug "${slug}" at index ${i}.`,
        { index: i },
      );
    }
    importSlugSet.add(slug);
  }

  const allRows = await db
    .select()
    .from(posChannels)
    .where(eq(posChannels.orgId, actor.orgId));

  const activeRows = allRows.filter((row) => row.deletedAt == null);
  const existingById = new Map(allRows.map((row) => [row.id, row]));
  const existingBySlug = new Map(activeRows.map((row) => [row.slug, row]));

  for (const item of prepared) {
    const slugOwner = existingBySlug.get(item.sanitized.normalizedSlug);
    if (slugOwner && slugOwner.id !== item.id) {
      return failure(
        "CHANNEL_SLUG_CONFLICT",
        `Slug "${item.sanitized.normalizedSlug}" is already used by channel ${slugOwner.id}.`,
      );
    }
  }

  type PlannedUpsert = {
    id: string;
    sanitized: import("../posSync/channelPayload.js").SanitizedChannelUpsert;
    existing: (typeof activeRows)[number] | null;
  };

  const planned: PlannedUpsert[] = prepared.map((item) => ({
    ...item,
    existing: existingById.get(item.id) ?? null,
  }));

  let added = 0;
  let updated = 0;
  let unchanged = 0;
  const now = new Date();

  try {
    const result = await db.transaction(async (tx) => {
      const touchedIds = new Set<string>();

      for (const item of planned) {
        const values = {
          slug: item.sanitized.normalizedSlug,
          name: item.sanitized.name,
          enabled: item.sanitized.enabled,
          provider: item.sanitized.provider,
          mode: item.sanitized.mode,
          storeId: item.sanitized.storeId,
          statusMapping: item.sanitized.statusMapping,
          notes: item.sanitized.notes,
          logoDataUrl: item.sanitized.logoDataUrl,
          configJson: item.sanitized.configJson,
          deletedAt: null as Date | null,
          clientUpdatedAt: now,
          updatedAt: now,
        };

        if (item.existing) {
          if (item.existing.deletedAt) {
            await tx
              .update(posChannels)
              .set(values)
              .where(
                and(eq(posChannels.orgId, actor.orgId), eq(posChannels.id, item.id)),
              );
            updated += 1;
            touchedIds.add(item.id);
            continue;
          }

          const same =
            item.existing.slug === values.slug &&
            item.existing.name === values.name &&
            item.existing.enabled === values.enabled &&
            item.existing.provider === values.provider &&
            item.existing.mode === values.mode &&
            item.existing.storeId === values.storeId &&
            JSON.stringify(item.existing.statusMapping ?? {}) ===
              JSON.stringify(values.statusMapping ?? {}) &&
            item.existing.notes === values.notes &&
            item.existing.logoDataUrl === values.logoDataUrl &&
            JSON.stringify(item.existing.configJson ?? {}) ===
              JSON.stringify(values.configJson ?? {});

          if (same) {
            unchanged += 1;
            touchedIds.add(item.id);
            continue;
          }

          await tx
            .update(posChannels)
            .set(values)
            .where(
              and(eq(posChannels.orgId, actor.orgId), eq(posChannels.id, item.id)),
            );
          updated += 1;
          touchedIds.add(item.id);
        } else {
          await tx.insert(posChannels).values({
            id: item.id,
            orgId: actor.orgId,
            customerId: actor.customerId,
            sourceDeviceId: null,
            ...values,
            syncBatchId: null,
            schemaVersion: item.sanitized.schemaVersion,
            createdAt: now,
          });
          added += 1;
          touchedIds.add(item.id);
        }
      }

      const keptExisting = activeRows.filter((row) => !touchedIds.has(row.id)).length;

      const refreshed = await tx
        .select()
        .from(posChannels)
        .where(
          and(eq(posChannels.orgId, actor.orgId), isNull(posChannels.deletedAt)),
        )
        .orderBy(asc(posChannels.updatedAt), asc(posChannels.id));

      return {
        channels: refreshed.map(dbRowToPortalChannel),
        keptExisting,
      };
    });

    return {
      ok: true,
      data: {
        channels: result.channels,
        added,
        updated,
        unchanged,
        keptExisting: result.keptExisting,
        strippedSecretPaths: parsed.strippedSecretPaths,
        secretImportNotice:
          parsed.strippedSecretPaths.length > 0
            ? "Secret fields were ignored during import because secure secret storage is not yet available."
            : "No secret fields were present in the import file.",
      },
    };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return failure(
        "CHANNEL_SLUG_CONFLICT",
        "Import failed because of a slug conflict.",
      );
    }
    throw err;
  }
}

/** @deprecated Use importPortalChannelsMerge — no longer soft-deletes existing channels. */
export async function importPortalChannelsReplace(
  actor: PortalChannelActor,
  rawPayload: unknown,
): Promise<
  PortalChannelResult<{
    channels: PortalChannelResponse[];
    strippedSecretPaths: string[];
    secretImportNotice: string;
  }>
> {
  const merged = await importPortalChannelsMerge(actor, rawPayload);
  if (!merged.ok) return merged;
  return {
    ok: true,
    data: {
      channels: merged.data.channels,
      strippedSecretPaths: merged.data.strippedSecretPaths,
      secretImportNotice: merged.data.secretImportNotice,
    },
  };
}

export async function setPortalChannelEnabled(
  actor: PortalChannelActor,
  channelId: string,
  enabled: boolean,
): Promise<PortalChannelResult<PortalChannelResponse>> {
  const [existing] = await db
    .select()
    .from(posChannels)
    .where(and(eq(posChannels.orgId, actor.orgId), eq(posChannels.id, channelId)))
    .limit(1);

  if (!existing || existing.deletedAt) {
    return failure("CHANNEL_NOT_FOUND", "Channel not found.");
  }

  const now = new Date();
  const [row] = await db
    .update(posChannels)
    .set({
      enabled,
      clientUpdatedAt: now,
      updatedAt: now,
    })
    .where(
      and(eq(posChannels.orgId, actor.orgId), eq(posChannels.id, channelId)),
    )
    .returning();

  return { ok: true, data: dbRowToPortalChannel(row) };
}
