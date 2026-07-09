import type { PortalReportsHourlyPoint } from "../portalApi";

export const HOURS_PER_DAY = 24;

/** Normalize sparse API hourly buckets to a full 00–23 series. */
export function normalizeSalesByHour(
  points: PortalReportsHourlyPoint[],
): PortalReportsHourlyPoint[] {
  const byHour = new Map(points.map((point) => [point.hour, point]));
  return Array.from({ length: HOURS_PER_DAY }, (_, hour) => {
    const existing = byHour.get(hour);
    return (
      existing ?? {
        hour,
        revenueMinor: 0,
        ordersCount: 0,
      }
    );
  });
}
