import React from "react";
import { Inbox } from "lucide-react";
import type { PortalSupportMessage } from "../../lib/portalApi";
import type { PortalTranslations } from "../../lib/translations/portal";
import { supportMessageLastUpdate } from "../../lib/support/deriveSupportState";
import { portalTableShell, portalTextLink } from "../../lib/portalUi";

function statusBadgeClass(status: string, isLight: boolean): string {
  if (status === "closed") {
    return isLight
      ? "support-status-badge support-status-badge--closed"
      : "support-status-badge support-status-badge--closed";
  }
  if (status === "in_progress") {
    return "support-status-badge support-status-badge--progress";
  }
  return "support-status-badge support-status-badge--open";
}

export function SupportRequestsList({
  messages,
  loading,
  isLight,
  locale,
  t,
}: {
  messages: PortalSupportMessage[];
  loading: boolean;
  isLight: boolean;
  locale: string;
  t: PortalTranslations;
}) {
  const s = t.support;
  const c = s.center;
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  function formatDate(value: string | null | undefined) {
    if (!value) return t.labels.dash;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(locale);
  }

  if (loading) {
    return (
      <section className="dashboard-panel">
        <h2 className="dashboard-panel-title">{c.sectionRequests}</h2>
        <p className="dashboard-text-muted text-xs">{s.loadingList}</p>
      </section>
    );
  }

  if (messages.length === 0) {
    return (
      <section className="dashboard-panel">
        <h2 className="dashboard-panel-title">{c.sectionRequests}</h2>
        <div className="support-empty-state">
          <Inbox className="support-empty-icon" strokeWidth={1.25} aria-hidden />
          <p>{s.emptyList}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-panel">
      <h2 className="dashboard-panel-title">{c.sectionRequests}</h2>
      <div className={portalTableShell(isLight)}>
        <table className="portal-table support-requests-table">
          <thead>
            <tr>
              <th>{c.colSubject}</th>
              <th>{c.colStatus}</th>
              <th>{c.colCreated}</th>
              <th>{c.colLastUpdate}</th>
              <th aria-label={c.colDetails} />
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => {
              const expanded = expandedId === m.id;
              return (
                <React.Fragment key={m.id}>
                  <tr>
                    <td className="support-requests-subject">{m.subject}</td>
                    <td>
                      <span className={statusBadgeClass(m.status, isLight)}>{m.status}</span>
                    </td>
                    <td className="support-requests-date">{formatDate(m.createdAt)}</td>
                    <td className="support-requests-date">
                      {formatDate(supportMessageLastUpdate(m))}
                    </td>
                    <td className="portal-table-actions text-right">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : m.id)}
                        className={`text-xs font-medium ${portalTextLink(isLight)}`}
                      >
                        {expanded ? c.hideDetails : c.viewDetails}
                      </button>
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="support-requests-detail-row">
                      <td colSpan={5}>
                        <div className="support-requests-detail">
                          <p className="support-requests-message">{m.message}</p>
                          {m.replyText ? (
                            <div className="support-requests-reply">
                              <div className="support-requests-reply-label">
                                {s.replyTitle}{" "}
                                {m.repliedAt ? `(${formatDate(m.repliedAt)})` : ""}
                              </div>
                              <p>{m.replyText}</p>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
