import { ArrowLeftRight, Ban, Printer, Receipt, RefreshCw, Undo2 } from "lucide-react";
import type { ReceiptEventRow } from "../../lib/receipts/types";

function eventIcon(kind: ReceiptEventRow["kind"]) {
  switch (kind) {
    case "created":
      return Receipt;
    case "printed":
      return Printer;
    case "reprinted":
      return RefreshCw;
    case "refund":
    case "partial_refund":
      return Undo2;
    case "payment_changed":
      return ArrowLeftRight;
    case "voided":
      return Ban;
    default:
      return Receipt;
  }
}

export function ReceiptEventsTimeline({
  events,
  title,
  emptyLabel,
  loading,
}: {
  events: ReceiptEventRow[];
  title: string;
  emptyLabel: string;
  loading?: boolean;
}) {
  return (
    <section className="receipt-detail-section">
      <h3 className="receipt-detail-section-title">{title}</h3>
      {loading ? (
        <p className="dashboard-text-muted">…</p>
      ) : events.length === 0 ? (
        <p className="dashboard-text-muted">{emptyLabel}</p>
      ) : (
        <ul className="dashboard-activity-list receipt-events-list">
          {events.map((event) => {
            const Icon = eventIcon(event.kind);
            return (
              <li key={event.id}>
                <div className="dashboard-activity-row receipt-event-row">
                  <Icon size={14} className="dashboard-icon--muted" />
                  <span className="receipt-event-time">{event.time}</span>
                  <span className="dashboard-activity-label">{event.label}</span>
                  <span className="receipt-event-actor">
                    {event.summary !== event.actor ? event.summary : event.actor}
                  </span>
                  {event.summary !== event.actor && event.actor ? (
                    <span className="receipt-event-actor">{event.actor}</span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
