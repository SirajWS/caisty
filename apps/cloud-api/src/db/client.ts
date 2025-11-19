import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ENV } from "../config/env";

const queryClient = postgres(ENV.DATABASE_URL, {
  max: 10
});

export const db = drizzle(queryClient);
