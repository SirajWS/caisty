import { integer, pgTable, uuid } from "drizzle-orm/pg-core";

import { orgs } from "./orgs.js";

/** Monotonic per-org station sequence. Never decremented, so codes are not reused after device deletion. */
export const orgStationCounters = pgTable("org_station_counters", {
  orgId: uuid("org_id")
    .primaryKey()
    .references(() => orgs.id, { onDelete: "cascade" }),
  lastAssigned: integer("last_assigned").notNull().default(0),
});
