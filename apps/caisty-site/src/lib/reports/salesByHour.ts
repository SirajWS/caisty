import type {
  PortalReportsHourlyPoint,
  PortalReportsRevenuePoint,
} from "../portalApi";

export const HOURS_PER_DAY = 24;

const HOURLY_REVENUE_BUCKET_PREFIX = "1970-01-01T";

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

export function isHourlyRevenueSeries(
  points: Pick<PortalReportsRevenuePoint, "label" | "bucketStart">[],
): boolean {
  if (points.length === 0) return false;
  return points.every(
    (point) =>
      point.bucketStart?.startsWith(HOURLY_REVENUE_BUCKET_PREFIX) ||
      /^\d{1,2}:\d{2}$/.test(point.label.trim()),
  );
}

function parseRevenueSeriesHour(point: PortalReportsRevenuePoint): number {
  if (point.bucketStart?.startsWith(HOURLY_REVENUE_BUCKET_PREFIX)) {
    const hour = new Date(point.bucketStart).getUTCHours();
    if (!Number.isNaN(hour)) return hour;
  }
  const match = point.label.trim().match(/^(\d{1,2}):00$/);
  return match ? Number(match[1]) : 0;
}

export function revenueSeriesToHourlyPoints(
  points: PortalReportsRevenuePoint[],
): PortalReportsHourlyPoint[] {
  return points.map((point) => ({
    hour: parseRevenueSeriesHour(point),
    revenueMinor: point.revenueMinor,
    ordersCount: point.ordersCount,
  }));
}

/** Shared 00–23 series for PDF hourly tables (prefers salesByHour). */
export function resolveNormalizedHourlyReportPoints(
  salesByHour: PortalReportsHourlyPoint[],
  revenueSeries: PortalReportsRevenuePoint[],
): PortalReportsHourlyPoint[] {
  if (salesByHour.length > 0) {
    return normalizeSalesByHour(salesByHour);
  }
  if (isHourlyRevenueSeries(revenueSeries)) {
    return normalizeSalesByHour(revenueSeriesToHourlyPoints(revenueSeries));
  }
  return normalizeSalesByHour([]);
}
