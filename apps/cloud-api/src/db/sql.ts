import postgres from "postgres";
import { env } from "../config/env";

const sql = postgres(env.DATABASE_URL, { max: 10 });

export default sql;
