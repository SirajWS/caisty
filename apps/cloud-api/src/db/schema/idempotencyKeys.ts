import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { orgs } from "./orgs";

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),

    key: text("key").notNull(),
    scope: text("scope").notNull(), // e.g. 'billing.checkout'
    requestHash: text("request_hash").notNull(),
    responseJson: text("response_json"), // später jsonb möglich, aber text reicht erstmal

    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (t) => ({
    uqKey: uniqueIndex("uq_idempotency_keys_key").on(t.key),
    idxOrgScope: index("idx_idempotency_keys_org_scope").on(t.orgId, t.scope),
  })
);

