import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, StatusPill } from "../../components/ui";
import {
  canRevokeLicense,
  REVOKE_LICENSE_CONFIRM_MESSAGE,
} from "../../lib/adminLicenseRevoke";
import { formatSeatUsage } from "../../lib/adminLicenseSeats";
import {
  DeviceStatusPill,
  LicenseStatusPill,
} from "../../lib/adminStatusPills";
import { apiGet, apiPost } from "../../lib/api";

type License = {
  id: string;
  key: string;
  plan: string;
  status: string;
  maxDevices: number | null;
  customerId: string | null;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  devicesCount?: number;
  seatSummary?: {
    used: number;
    limit: number | null;
    unlimitedDevices: boolean;
  };
};

type LicenseEvent = {
  id: string;
  type: string;
  metadata: any | null;
  createdAt: string;
};

type EventsResponse = {
  items: LicenseEvent[];
};

type Device = {
  id: string;
  name: string | null;
  type: string | null;
  status: string | null;

  customerId: string | null;
  customerName: string | null;

  licenseId: string | null;
  licenseKey: string | null;
  licensePlan: string | null;
  licenseValidFrom: string | null;
  licenseValidUntil: string | null;

  lastHeartbeatAt: string | null;
  createdAt: string;
  archivedAt?: string | null;

  licenses?: Array<{
    id: string;
    key: string | null;
    plan: string | null;
    validFrom: string | null;
    validUntil: string | null;
  }>;
};

type DeviceListResponse = {
  items: Device[];
  total: number;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB");
}

function classifySignal(
  lastHeartbeatAt: string | null,
): "never" | "online" | "stale" | "offline" {
  if (!lastHeartbeatAt) return "never";
  const d = new Date(lastHeartbeatAt);
  if (Number.isNaN(d.getTime())) return "never";

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours <= 24) return "online";
  if (diffHours <= 24 * 7) return "stale";
  return "offline";
}

function DeviceSignalPill({
  kind,
}: {
  kind: "never" | "online" | "stale" | "offline";
}) {
  switch (kind) {
    case "online":
      return <StatusPill tone="green" label="Online" />;
    case "stale":
      return <StatusPill tone="amber" label="Stale" />;
    case "offline":
      return <StatusPill tone="red" label="Offline" />;
    case "never":
    default:
      return <StatusPill tone="gray" label="Never" />;
  }
}

export default function LicenseDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [license, setLicense] = useState<License | null>(null);
  const [events, setEvents] = useState<LicenseEvent[]>([]);
  const [licenseDevices, setLicenseDevices] = useState<Device[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [revokeSuccess, setRevokeSuccess] = useState<string | null>(null);

  async function loadData() {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const [licenseRes, eventsRes, devicesRes] = await Promise.all([
        apiGet<{ item: License }>(`/licenses/${id}`),
        apiGet<EventsResponse>(`/licenses/${id}/events`),
        apiGet<DeviceListResponse>("/devices"),
      ]);

      setLicense(licenseRes.item);
      setEvents(eventsRes.items);

      const devsForLicense = (devicesRes.items ?? []).filter(
        (dev) =>
          dev.licenseId === licenseRes.item.id && !dev.archivedAt,
      );
      setLicenseDevices(devsForLicense);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load license.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleRevoke() {
    if (!license || !canRevokeLicense(license.status) || revokeLoading) return;
    if (!window.confirm(REVOKE_LICENSE_CONFIRM_MESSAGE)) return;

    setRevokeError(null);
    setRevokeSuccess(null);
    setRevokeLoading(true);
    try {
      const result = await apiPost<
        Record<string, never>,
        { item: License; message?: string }
      >(`/licenses/${license.id}/revoke`, {});
      if (result.item) {
        setLicense(result.item);
      } else {
        setLicense((prev) =>
          prev ? { ...prev, status: "revoked" } : prev,
        );
      }
      setRevokeSuccess(
        result.message ||
          "License revoked. Device assignments were not changed.",
      );
      await loadData();
    } catch (err: any) {
      console.error(err);
      setRevokeError(err?.message || "Failed to revoke license.");
    } finally {
      setRevokeLoading(false);
    }
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">License Details</h1>
      <p className="admin-page-subtitle">
        Details and events for a license key.
      </p>

      <p style={{ fontSize: 13, marginBottom: 16 }}>
        <Link to="/licenses" className="ds-link">
          ← Back to list
        </Link>
      </p>

      {loading && <div>Loading…</div>}
      {error && <div className="admin-error">{error}</div>}

      {license && !loading && !error && (
        <>
          <div
            className="dashboard-card"
            style={{ marginBottom: 24, display: "flex", gap: 24 }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                {license.key}
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                Plan: <strong>{license.plan}</strong>
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                Occupied seats:{" "}
                <strong>
                  {formatSeatUsage(
                    license.seatSummary?.used ?? license.devicesCount ?? 0,
                    license.maxDevices,
                  )}
                </strong>
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                License status is independent of occupied seats. Revoke does not
                release devices.
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                Customer:{" "}
                {license.customerId ? (
                  <span>{license.customerId}</span>
                ) : (
                  "—"
                )}
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                Valid from: {formatDate(license.validFrom)}
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                Valid until: {formatDate(license.validUntil)}
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                Created: {formatDate(license.createdAt)}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                justifyContent: "space-between",
                minWidth: 160,
                gap: 12,
              }}
            >
              <LicenseStatusPill status={license.status} />

              {canRevokeLicense(license.status) ? (
                <Button
                  variant="danger"
                  onClick={() => void handleRevoke()}
                  disabled={revokeLoading}
                >
                  {revokeLoading ? "Revoking…" : "Revoke license"}
                </Button>
              ) : null}

              {revokeSuccess ? (
                <div className="admin-success-banner">{revokeSuccess}</div>
              ) : null}

              {revokeError && (
                <div
                  className="admin-error"
                  style={{ marginTop: 8, textAlign: "right" }}
                >
                  {revokeError}
                </div>
              )}
            </div>
          </div>

          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Devices with this license
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              marginBottom: 8,
            }}
          >
            Currently assigned device rows (one per device ID). Occupied seats
            count only active and blocked assignments.
          </p>

          <div className="admin-table-wrapper" style={{ marginBottom: 24 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name / Device ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Last signal</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {licenseDevices.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      No devices linked to this license yet.
                    </td>
                  </tr>
                ) : (
                  licenseDevices.map((dev) => {
                    const signalKind = classifySignal(dev.lastHeartbeatAt);
                    return (
                      <tr key={dev.id}>
                        <td>
                          <div>{dev.name || "—"}</div>
                          <div
                            style={{
                              fontSize: 11,
                              opacity: 0.6,
                              fontFamily:
                                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                            }}
                          >
                            {dev.id.slice(0, 8)}…
                          </div>
                        </td>
                        <td>
                          {dev.customerId ? (
                            <Link
                              to={`/customers/${dev.customerId}`}
                              className="ds-link"
                            >
                              {dev.customerName ||
                                `${dev.customerId.slice(0, 8)}…`}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          {dev.status ? (
                            <DeviceStatusPill status={dev.status} />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <div>{formatDate(dev.lastHeartbeatAt)}</div>
                          <div style={{ marginTop: 4 }}>
                            <DeviceSignalPill kind={signalKind} />
                          </div>
                        </td>
                        <td>{formatDate(dev.createdAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Events
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              marginBottom: 8,
            }}
          >
            Activity for this license (activation, heartbeats, etc.).
          </p>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && (
                  <tr>
                    <td colSpan={3}>No events for this license yet.</td>
                  </tr>
                )}
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.type}</td>
                    <td>
                      {event.metadata
                        ? JSON.stringify(event.metadata)
                        : "—"}
                    </td>
                    <td>{formatDate(event.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
