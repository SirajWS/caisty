/** Exact POS sale quantity: PostgreSQL numeric(12,3). Money stays integer minor units. */

export const POS_QUANTITY_PRECISION = 12;
export const POS_QUANTITY_SCALE = 3;
export const POS_QUANTITY_MAX = 999_999_999.999;

export function asPosQuantity(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return Number.NaN;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Number.NaN;
}

function hasAtMostScale(value: number, scale: number): boolean {
  const text = value.toString();
  if (/e/i.test(text)) {
    const factor = 10 ** scale;
    return Math.abs(Math.round(value * factor) - value * factor) < 1e-8;
  }
  const dot = text.indexOf(".");
  if (dot < 0) return true;
  return text.length - dot - 1 <= scale;
}

export function parsePosSyncQuantity(
  value: unknown,
): { ok: true; quantity: number } | { ok: false; error: string } {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { ok: false, error: "quantity must be a finite number." };
  }
  if (value <= 0) {
    return { ok: false, error: "quantity must be greater than 0." };
  }
  if (value > POS_QUANTITY_MAX) {
    return { ok: false, error: "quantity exceeds the supported range." };
  }
  if (!hasAtMostScale(value, POS_QUANTITY_SCALE)) {
    return {
      ok: false,
      error: "quantity must have at most 3 decimal places.",
    };
  }
  return { ok: true, quantity: value };
}

/** Integer quantities stay "3"; fractional values stay exact ("1.25", "0.125"). */
export function formatPosQuantity(value: unknown): string {
  const quantity = asPosQuantity(value);
  if (!Number.isFinite(quantity)) return "";
  if (Number.isInteger(quantity)) return String(quantity);
  return String(quantity);
}
