// src/lib/api.ts
const API_BASE = "/api";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(API_BASE + path);
  if (!res.ok) {
    throw new Error(`API error ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
