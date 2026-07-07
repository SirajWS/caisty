import { Inbox } from "lucide-react";

export function SupportRequestsEmptyState({
  headline,
  description,
}: {
  headline: string;
  description: string;
}) {
  return (
    <div className="support-requests-empty">
      <div className="support-requests-empty-icon" aria-hidden>
        <Inbox size={28} className="dashboard-icon--muted" />
      </div>
      <h3 className="support-requests-empty-headline">{headline}</h3>
      <p className="support-requests-empty-desc">{description}</p>
    </div>
  );
}
