import { and, eq, isNull, ne } from "drizzle-orm";



import { db } from "../db/client.js";

import { posChannels } from "../db/schema/posChannels.js";

import type { PosDeviceAuthContext } from "../lib/posDeviceAuth.js";

import {

  sanitizeChannelUpsertPayload,

  type SanitizedChannelUpsert,

} from "./channelPayload.js";

import { parseIsoDate } from "./validateSyncBatch.js";

import type { PosSyncChannelPayload } from "./types.js";



export type ChannelSyncDb = Pick<typeof db, "select" | "insert" | "update">;



function isUniqueViolation(err: unknown): boolean {

  return (

    typeof err === "object" &&

    err !== null &&

    "code" in err &&

    (err as { code?: string }).code === "23505"

  );

}



function isStaleClientUpdate(

  existingClientUpdatedAt: Date,

  incomingClientUpdatedAt: Date,

): boolean {

  return existingClientUpdatedAt.getTime() > incomingClientUpdatedAt.getTime();

}



function isSameClientTimestamp(

  existingClientUpdatedAt: Date,

  incomingClientUpdatedAt: Date,

): boolean {

  return existingClientUpdatedAt.getTime() === incomingClientUpdatedAt.getTime();

}



export class ChannelSyncService {

  async processChannelEvent(

    payload: PosSyncChannelPayload,

    auth: PosDeviceAuthContext,

    batchId: string,

    dbClient: ChannelSyncDb = db,

  ): Promise<

    | { status: "accepted" | "duplicate" }

    | { status: "failed"; code: string; error: string }

  > {

    const clientUpdatedAt = parseIsoDate(

      payload.clientUpdatedAt,

      "clientUpdatedAt",

    );

    if (!clientUpdatedAt) {

      return {

        status: "failed",

        code: "invalid_payload",

        error: "clientUpdatedAt must be a valid ISO timestamp.",

      };

    }



    if (payload.op === "delete") {

      return this.deleteChannel(

        payload.channelId,

        clientUpdatedAt,

        auth,

        batchId,

        dbClient,

      );

    }



    return this.upsertChannel(payload, clientUpdatedAt, auth, batchId, dbClient);

  }



  private async findChannel(

    orgId: string,

    channelId: string,

    dbClient: ChannelSyncDb,

  ) {

    const [row] = await dbClient

      .select()

      .from(posChannels)

      .where(and(eq(posChannels.orgId, orgId), eq(posChannels.id, channelId)))

      .limit(1);

    return row ?? null;

  }



  private async findActiveSlugConflict(

    orgId: string,

    normalizedSlug: string,

    channelId: string,

    dbClient: ChannelSyncDb,

  ) {

    const [row] = await dbClient

      .select({ id: posChannels.id })

      .from(posChannels)

      .where(

        and(

          eq(posChannels.orgId, orgId),

          eq(posChannels.slug, normalizedSlug),

          ne(posChannels.id, channelId),

          isNull(posChannels.deletedAt),

        ),

      )

      .limit(1);

    return row ?? null;

  }



  private async upsertChannel(

    payload: PosSyncChannelPayload,

    clientUpdatedAt: Date,

    auth: PosDeviceAuthContext,

    batchId: string,

    dbClient: ChannelSyncDb,

  ): Promise<

    | { status: "accepted" | "duplicate" }

    | { status: "failed"; code: string; error: string }

  > {

    const sanitizedResult = sanitizeChannelUpsertPayload(

      payload as unknown as Record<string, unknown>,

    );

    if (!sanitizedResult.ok) {

      return {

        status: "failed",

        code: sanitizedResult.code,

        error: sanitizedResult.error,

      };

    }



    const sanitized = sanitizedResult.sanitized;

    const existing = await this.findChannel(auth.orgId, payload.channelId, dbClient);



    if (existing) {

      if (isStaleClientUpdate(existing.clientUpdatedAt, clientUpdatedAt)) {

        return { status: "duplicate" };

      }

      if (

        !existing.deletedAt &&

        isSameClientTimestamp(existing.clientUpdatedAt, clientUpdatedAt)

      ) {

        return { status: "duplicate" };

      }

    }



    const slugConflict = await this.findActiveSlugConflict(

      auth.orgId,

      sanitized.normalizedSlug,

      payload.channelId,

      dbClient,

    );

    if (slugConflict) {

      return {

        status: "failed",

        code: "channel_slug_conflict",

        error: `Slug "${sanitized.normalizedSlug}" is already used by another active channel in this organization.`,

      };

    }



    const now = new Date();

    const values = this.buildRowValues(

      payload.channelId,

      sanitized,

      auth,

      batchId,

      clientUpdatedAt,

      now,

      existing?.createdAt ?? now,

    );



    try {

      if (existing) {

        await dbClient

          .update(posChannels)

          .set({

            ...values,

            createdAt: existing.createdAt,

          })

          .where(

            and(

              eq(posChannels.orgId, auth.orgId),

              eq(posChannels.id, payload.channelId),

            ),

          );

      } else {

        await dbClient.insert(posChannels).values(values);

      }

      return { status: "accepted" };

    } catch (err: unknown) {

      if (isUniqueViolation(err)) {

        const refreshed = await this.findChannel(

          auth.orgId,

          payload.channelId,

          dbClient,

        );

        if (

          refreshed &&

          isStaleClientUpdate(refreshed.clientUpdatedAt, clientUpdatedAt)

        ) {

          return { status: "duplicate" };

        }

        return {

          status: "failed",

          code: "channel_slug_conflict",

          error: `Slug "${sanitized.normalizedSlug}" conflicts with another channel in this organization.`,

        };

      }

      throw err;

    }

  }



  private async deleteChannel(

    channelId: string,

    clientUpdatedAt: Date,

    auth: PosDeviceAuthContext,

    batchId: string,

    dbClient: ChannelSyncDb,

  ): Promise<

    | { status: "accepted" | "duplicate" }

    | { status: "failed"; code: string; error: string }

  > {

    const existing = await this.findChannel(auth.orgId, channelId, dbClient);



    if (!existing) {

      const now = new Date();

      await dbClient.insert(posChannels).values({

        id: channelId,

        orgId: auth.orgId,

        customerId: auth.customerId,

        sourceDeviceId: auth.deviceId,

        slug: `deleted-${channelId.replace(/-/g, "").slice(0, 12)}`,

        name: "Deleted Channel",

        enabled: false,

        provider: null,

        mode: null,

        storeId: null,

        statusMapping: {},

        notes: null,

        logoDataUrl: null,

        configJson: {},

        deletedAt: now,

        clientUpdatedAt,

        syncBatchId: batchId,

        schemaVersion: 1,

        createdAt: now,

        updatedAt: now,

      });

      return { status: "accepted" };

    }



    if (isStaleClientUpdate(existing.clientUpdatedAt, clientUpdatedAt)) {

      return { status: "duplicate" };

    }

    if (

      existing.deletedAt &&

      isSameClientTimestamp(existing.clientUpdatedAt, clientUpdatedAt)

    ) {

      return { status: "duplicate" };

    }



    const now = new Date();

    await dbClient

      .update(posChannels)

      .set({

        deletedAt: now,

        enabled: false,

        clientUpdatedAt,

        sourceDeviceId: auth.deviceId,

        syncBatchId: batchId,

        updatedAt: now,

      })

      .where(

        and(eq(posChannels.orgId, auth.orgId), eq(posChannels.id, channelId)),

      );



    return { status: "accepted" };

  }



  private buildRowValues(

    channelId: string,

    sanitized: SanitizedChannelUpsert,

    auth: PosDeviceAuthContext,

    batchId: string,

    clientUpdatedAt: Date,

    now: Date,

    createdAt: Date,

  ) {

    return {

      id: channelId,

      orgId: auth.orgId,

      customerId: auth.customerId,

      sourceDeviceId: auth.deviceId,

      slug: sanitized.normalizedSlug,

      name: sanitized.name,

      enabled: sanitized.enabled,

      provider: sanitized.provider,

      mode: sanitized.mode,

      storeId: sanitized.storeId,

      statusMapping: sanitized.statusMapping,

      notes: sanitized.notes,

      logoDataUrl: sanitized.logoDataUrl,

      configJson: sanitized.configJson,

      deletedAt: null as Date | null,

      clientUpdatedAt,

      syncBatchId: batchId,

      schemaVersion: sanitized.schemaVersion,

      createdAt,

      updatedAt: now,

    };

  }

}



export const channelSyncService = new ChannelSyncService();

