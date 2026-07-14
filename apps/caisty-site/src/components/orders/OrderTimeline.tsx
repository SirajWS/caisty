import { CheckCircle2, Circle, CreditCard, RefreshCw, XCircle } from "lucide-react";
import type { PortalOrderTimelineEntry } from "../../lib/portalApi";

function timelineIcon(kind: PortalOrderTimelineEntry["kind"]) {
  switch (kind) {
    case "paid":
      return CreditCard;
    case "completed":
      return CheckCircle2;
    case "cancelled":
      return XCircle;
    case "refunded":
      return RefreshCw;
    default:
      return Circle;
  }
}

export function OrderTimeline({
  events,
  locale,
  timezone,
  title,
  emptyLabel,
}: {
  events: PortalOrderTimelineEntry[];
  locale: string;
  timezone: string;
  title: string;
  emptyLabel: string;
}) {
  if (events.length === 0) {
    return (
      <section className="receipt-detail-section">
        <h3 className="receipt-detail-section-title">{title}</h3>
        <p className="dashboard-text-muted">{emptyLabel}</p>
      </section>
    );
  }

  return (
    <section className="receipt-detail-section">
      <h3 className="receipt-detail-section-title">{title}</h3>
      <ul className="dashboard-activity-list order-timeline-list">
        {events.map((event) => {
          const Icon = timelineIcon(event.kind);
          const time = new Intl.DateTimeFormat(locale, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: timezone,
          }).format(new Date(event.occurredAt));

          return (
            <li key={event.id}>
              <div className="dashboard-activity-row order-timeline-row">
                <Icon size={14} className="dashboard-icon--muted" />
                <span className="receipt-event-time">{time}</span>
                <span className="dashboard-activity-label">{event.label}</span>
                {event.summary ? (
                  <span className="receipt-event-actor">{event.summary}</span>
                ) : null}
                {event.actor ? (
                  <span className="receipt-event-actor">{event.actor}</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
