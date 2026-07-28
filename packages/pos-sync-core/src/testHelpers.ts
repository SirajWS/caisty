import type { KeyValueStorage } from "./types.js";

export function makeMemoryStorage(): KeyValueStorage & {
  clear(): void;
} {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    clear: () => map.clear(),
  };
}
