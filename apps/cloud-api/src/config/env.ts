import * as dotenv from "dotenv";

dotenv.config(); // nimmt .env aus apps/cloud-api

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export const ENV = {
  PORT: Number(process.env.PORT ?? 3333),
  DATABASE_URL: requireEnv("DATABASE_URL")
};
