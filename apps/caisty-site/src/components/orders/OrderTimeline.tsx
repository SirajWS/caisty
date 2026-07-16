import {
  ArrowLeftRight,
  CheckCircle2,
  Circle,
  CreditCard,
  Printer,
  Receipt,
  Undo2,
  XCircle,
} from "lucide-react";
import type { PortalOrderTimelineEntry } from "../../lib/portalApi";

export type CaistyActivityEvent = {
  id: string;
  kind: string;
  label: string;
  occurredAt: string;
  actor?: string | null;
  summary?: string | null;
  source?: "order" | "receipt";
};

function timelineIcon(kind: string) {
  switch (kind) {
    case "paid":
      return CreditCard;
    case "completed":
    case "created":
      return CheckCircle2;
    case "cancelled":
    case "voided":
      return XCircle;
    case "refunded":
    case "refund":
    case "partial_refund":
      return Undo2;
    case "printed":
    case "reprinted":
      return Printer;
    case "payment_changed":
      return ArrowLeftRight;
    case "receipt":
      return Receipt;
    case "preparing":
    case "ready":
      return Circle;
    default:
      return Circle;
  }
}

function toneForKind(kind: string): string {
  switch (kind) {
    case "paid":
    case "completed":
    case "created":
    case "printed":
      return "caisty-timeline-node--success";
    case "cancelled":
    case "voided":
      return "caisty-timeline-node--neutral";
    case "refunded":
    case "refund":
    case "partial_refund":
      return "caisty-timeline-node--danger";
    case "payment_changed":
    case "ready":
    case "preparing":
      return "caisty-timeline-node--progress";
    default:
      return "caisty-timeline-node--muted";
  }
}

function formatEventTime(
  iso: string,
  locale: string,
  timezone: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(iso));
}

/** Merge order + receipt events into one chronological activity feed. */
export function mergeActivityEvents(
  orderEvents: PortalOrderTimelineEntry[],
  receiptEvents: Array<{
    id: string;
    kind: string;
    label: string;
    occurredAt: string;
    actor?: string | null;
    summary?: string | null;
  }>,
): CaistyActivityEvent[] {
  const merged: CaistyActivityEvent[] = [
    ...orderEvents.map((event) => ({
      id: `order-${event.id}`,
      kind: event.kind,
      label: event.label,
      occurredAt: event.occurredAt,
      actor: event.actor,
      summary: event.summary,
      source: "order" as const,
    })),
    ...receiptEvents.map((event) => ({
      id: `receipt-${event.id}`,
      kind: event.kind,
      label: event.label,
      occurredAt: event.occurredAt,
      actor: event.actor,
      summary: event.summary,
      source: "receipt" as const,
    })),
  ];

  return merged.sort(
    (a, b) =>
      new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
}

export function OrderTimeline({
  events,
  locale,
  timezone,
  title,
  emptyLabel,
  loading = false,
  sourceLabels,
}: {
  events: CaistyActivityEvent[] | PortalOrderTimelineEntry[];
  locale: string;
  timezone: string;
  title: string;
  emptyLabel: string;
  loading?: boolean;
  sourceLabels?: { order: string; receipt: string };
}) {
  if (loading) {
    return (
      <section className="caisty-drawer-section">
        <h3 className="caisty-drawer-section-title">{title}</h3>
        <div className="caisty-drawer-skeleton-stack" aria-hidden="true">
          <div className="caisty-drawer-skeleton-line" />
          <div className="caisty-drawer-skeleton-line caisty-drawer-skeleton-line--short" />
          <div className="caisty-drawer-skeleton-line" />
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="caisty-drawer-section">
        <h3 className="caisty-drawer-section-title">{title}</h3>
        <p className="caisty-drawer-empty">{emptyLabel}</p>
      </section>
    );
  }

  const lastIndex = events.length - 1;

  return (
    <section className="caisty-drawer-section">
      <h3 className="caisty-drawer-section-title">{title}</h3>
      <ol className="caisty-timeline">
        {events.map((event, index) => {
          const Icon = timelineIcon(event.kind);
          const isCurrent = index === lastIndex;
          const detail =
            "summary" in event && event.summary && event.summary !== event.actor
              ? event.summary
              : null;
          const actor = event.actor?.trim() || null;

          return (
            <li
              key={event.id}
              className={`caisty-timeline-item${isCurrent ? " caisty-timeline-item--current" : ""}`}
            >
              <div
                className={`caisty-timeline-node ${toneForKind(event.kind)}${isCurrent ? " caisty-timeline-node--current" : ""}`}
                aria-hidden="true"
              >
                <Icon size={12} strokeWidth={2.25} />
              </div>
              <div className="caisty-timeline-body">
                <div className="caisty-timeline-meta">
                  <time
                    className="caisty-timeline-time"
                    dateTime={event.occurredAt}
                  >
                    {formatEventTime(event.occurredAt, locale, timezone)}
                  </time>
                  {"source" in event && event.source && sourceLabels ? (
                    <span className="caisty-timeline-source">
                      {event.source === "receipt"
                        ? sourceLabels.receipt
                        : sourceLabels.order}
                    </span>
                  ) : null}
                </div>
                <p className="caisty-timeline-label">{event.label}</p>
                {detail ? (
                  <p className="caisty-timeline-detail">{detail}</p>
                ) : null}
                {actor ? (
                  <p className="caisty-timeline-actor">{actor}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
