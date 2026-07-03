// apps/cloud-admin/src/pages/Webhooks/WebhooksListPage.tsx
import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";
import {
  Button,
  DataTable,
  PageHeader,
} from "../../components/ui";
import { WebhookStatusPill } from "../../lib/adminStatusPills";

type Webhook = {
  id: string;
  provider: string;
  eventType: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
};

type WebhooksResponse = {
  items: Webhook[];
  total: number;
};

export default function WebhooksListPage() {
  const [data, setData] = useState<WebhooksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedErrors, setExpandedErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiGet<WebhooksResponse>("/webhooks");
        if (cancelled) return;
        setData(res);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Failed to load webhooks.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = data?.items ?? [];
  const shortId = (id: string) => (id ? `${id.slice(0, 8)}…` : "—");

  return (
    <div className="admin-page">
      <PageHeader
        title="Webhooks"
        subtitle="Incoming webhook events (e.g. from PayPal sandbox)."
      />

      {error ? <div className="admin-error-banner">{error}</div> : null}

      <div className="ds-section-block">
        <DataTable>
          <thead>
            <tr>
              <th>ID</th>
              <th>Provider</th>
              <th>Event</th>
              <th>Status</th>
              <th>Error</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="ds-muted" style={{ textAlign: "center", padding: 24 }}>
                  Loading webhooks…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="ds-muted" style={{ textAlign: "center", padding: 24 }}>
                  No webhooks found.
                </td>
              </tr>
            ) : (
              items.map((w) => (
                <tr key={w.id}>
                  <td>{shortId(w.id)}</td>
                  <td>{w.provider}</td>
                  <td>{w.eventType}</td>
                  <td>
                    <WebhookStatusPill status={w.status} />
                  </td>
                  <td style={{ maxWidth: 260 }}>
                    {w.errorMessage ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span title={w.errorMessage}>
                          {expandedErrors[w.id]
                            ? w.errorMessage
                            : w.errorMessage.length > 40
                              ? `${w.errorMessage.slice(0, 40)}…`
                              : w.errorMessage}
                        </span>
                        {w.errorMessage.length > 40 ? (
                          <Button
                            variant="link"
                            onClick={() =>
                              setExpandedErrors((prev) => ({
                                ...prev,
                                [w.id]: !prev[w.id],
                              }))
                            }
                          >
                            {expandedErrors[w.id] ? "Show less" : "Show more"}
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {w.createdAt
                      ? new Date(w.createdAt).toLocaleString("en-GB")
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
}
