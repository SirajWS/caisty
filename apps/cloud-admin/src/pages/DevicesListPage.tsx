import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  apiArchiveDevice,
  apiDeleteDevice,
  apiGet,
  apiUnarchiveDevice,
} from "../lib/api";
import {
  Button,
  DataTable,
  PageHeader,
  Select,
  Toolbar,
} from "../components/ui";
import { DeviceStatusPill, LicenseStatusPill } from "../lib/adminStatusPills";
import {
  ARCHIVE_CONFIRM_MESSAGE,
  canArchiveDevice,
  canReleaseDevice,
  currentLicenseSummary,
  filterDevicesForView,
  formatLicenseExpiry,
  RELEASE_CONFIRM_MESSAGE,
  type AdminDeviceListItem,
  type AdminDeviceListView,
} from "../lib/adminDeviceList";

type DevicesResponse = {
  items: AdminDeviceListItem[];
  total: number;
  limit: number;
  offset: number;
};

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB");
}

export default function DevicesListPage() {
  const [rows, setRows] = useState<AdminDeviceListItem[]>([]);
  const [view, setView] = useState<AdminDeviceListView>("current");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedFingerprint, setCopiedFingerprint] = useState<string | null>(null);

  const loadDevices = useCallback(async () => {
    const [live, archived] = await Promise.all([
      apiGet<DevicesResponse>("/devices"),
      apiGet<DevicesResponse>("/devices?archived=1"),
    ]);
    setRows([...(live.items ?? []), ...(archived.items ?? [])]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadDevices();
      } catch (err) {
        console.error("Error loading devices", err);
        if (!cancelled) {
          setError("Failed to load devices.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadDevices]);

  async function handleReleaseDevice(device: AdminDeviceListItem) {
    if (!canReleaseDevice(device)) return;
    if (!window.confirm(RELEASE_CONFIRM_MESSAGE)) return;

    setBusyId(device.id);
    setError(null);
    setSuccess(null);

    try {
      await apiDeleteDevice(device.id);
      setSuccess(
        "Device released. Historical records and receipts are unchanged.",
      );
      await loadDevices();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not release device.";
      if (/already_released/i.test(message)) {
        setError("This device is already released.");
        await loadDevices();
      } else if (/not_bound/i.test(message)) {
        setError("This device is not bound to a license.");
        await loadDevices();
      } else {
        setError(message);
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleArchiveDevice(device: AdminDeviceListItem) {
    if (!canArchiveDevice(device)) return;
    if (!window.confirm(ARCHIVE_CONFIRM_MESSAGE)) return;

    setBusyId(device.id);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiArchiveDevice(device.id);
      setSuccess(
        result.message ||
          "Device archived from management views. Historical records remain.",
      );
      await loadDevices();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not archive device.";
      setError(message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleUnarchiveDevice(device: AdminDeviceListItem) {
    if (!device.archivedAt) return;
    if (
      !window.confirm(
        "Restore this device to normal Super-Admin management views?",
      )
    ) {
      return;
    }

    setBusyId(device.id);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiUnarchiveDevice(device.id);
      setSuccess(result.message || "Device restored to management views.");
      await loadDevices();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not restore device.";
      setError(message);
    } finally {
      setBusyId(null);
    }
  }

  const visibleRows = useMemo(() => {
    const filtered = filterDevicesForView(rows, view);
    return [...filtered].sort((a, b) => {
      const fa = (a.fingerprint ?? a.id).toLowerCase();
      const fb = (b.fingerprint ?? b.id).toLowerCase();
      if (fa !== fb) return fa.localeCompare(fb);
      const ca = (a.customerName ?? "").toLowerCase();
      const cb = (b.customerName ?? "").toLowerCase();
      if (ca !== cb) return ca.localeCompare(cb);
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  }, [rows, view]);

  const counts = {
    current: filterDevicesForView(rows, "current").length,
    released: filterDevicesForView(rows, "released").length,
    all: filterDevicesForView(rows, "all").length,
    archived: filterDevicesForView(rows, "archived").length,
  };

  return (
    <div className="admin-page">
      <PageHeader
        title="Devices"
        subtitle="POS devices for this platform. One row per device record — the same hardware ID may appear more than once when a device was released and rebound. Archive History is a read-only recovery view of removed records."
      />

      {error ? <div className="admin-error-banner">{error}</div> : null}
      {success ? <div className="admin-success-banner">{success}</div> : null}

      <Toolbar
        footer={`${visibleRows.length} shown · ${counts.current} current · ${counts.released} released · ${counts.all} history · ${counts.archived} archived`}
      >
        <Select
          value={view}
          onChange={(e) => setView(e.target.value as AdminDeviceListView)}
          aria-label="Device view"
        >
          <option value="current">Current</option>
          <option value="released">Released</option>
          <option value="all">All History</option>
          <option value="archived">Archive History</option>
        </Select>
      </Toolbar>

      <div className="ds-section-block">
        <DataTable>
          <thead>
            <tr>
              <th>Name</th>
              <th>Station</th>
              <th>Fingerprint</th>
              <th>Current license</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Last contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="ds-muted" style={{ textAlign: "center", padding: 24 }}>
                  Loading devices…
                </td>
              </tr>
            ) : visibleRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="ds-muted" style={{ textAlign: "center", padding: 24 }}>
                  No devices in this view.
                </td>
              </tr>
            ) : (
              visibleRows.map((d) => {
                const lastContact = d.lastHeartbeatAt || d.lastSeenAt || null;
                const license = currentLicenseSummary(d);
                const showRelease = canReleaseDevice(d);
                const showRemove = canArchiveDevice(d);
                const showRestore = Boolean(d.archivedAt);

                return (
                  <tr key={d.id}>
                    <td>
                      <div style={{ whiteSpace: "nowrap" }}>{d.name}</div>
                      <div className="ds-muted" style={{ marginTop: 2, textTransform: "uppercase" }}>
                        {d.type}
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                      {d.stationCode ?? "—"}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{d.fingerprint ?? d.id}</span>
                        <Button
                          variant="secondary"
                          title={copiedFingerprint === d.id ? "Copied" : "Copy fingerprint"}
                          style={{ height: 26, fontSize: 11, padding: "0 8px" }}
                          onClick={async () => {
                            const value = d.fingerprint ?? d.id;
                            try {
                              await navigator.clipboard.writeText(value);
                              setCopiedFingerprint(d.id);
                              window.setTimeout(
                                () =>
                                  setCopiedFingerprint((prev) =>
                                    prev === d.id ? null : prev,
                                  ),
                                1200,
                              );
                            } catch (err) {
                              console.error("copy fingerprint failed", err);
                            }
                          }}
                        >
                          {copiedFingerprint === d.id ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    </td>
                    <td>
                      {license.label === "Unassigned" ? (
                        <span className="ds-muted">Unassigned</span>
                      ) : (
                        <div>
                          <div>{license.plan}</div>
                          {license.status ? (
                            <div style={{ marginTop: 2 }}>
                              <LicenseStatusPill status={license.status} />
                            </div>
                          ) : null}
                          <div className="ds-muted" style={{ marginTop: 2, fontSize: 11 }}>
                            Expires {formatLicenseExpiry(license.expiry)}
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      {d.customerId ? (
                        <Link to={`/customers/${d.customerId}`} className="ds-link">
                          {d.customerName ?? d.customerId}
                        </Link>
                      ) : (
                        <span className="ds-muted">—</span>
                      )}
                    </td>
                    <td>
                      <DeviceStatusPill
                        status={d.status}
                        licenseId={d.licenseId}
                        archivedAt={d.archivedAt}
                      />
                    </td>
                    <td className="ds-muted" style={{ whiteSpace: "nowrap" }}>
                      {formatDateTime(lastContact)}
                    </td>
                    <td>
                      {showRelease ? (
                        <Button
                          variant="danger"
                          disabled={busyId === d.id}
                          onClick={() => void handleReleaseDevice(d)}
                        >
                          {busyId === d.id ? "Releasing…" : "Release"}
                        </Button>
                      ) : showRemove ? (
                        <Button
                          variant="danger"
                          disabled={busyId === d.id}
                          onClick={() => void handleArchiveDevice(d)}
                        >
                          {busyId === d.id ? "Removing…" : "Remove"}
                        </Button>
                      ) : showRestore ? (
                        <Button
                          variant="secondary"
                          disabled={busyId === d.id}
                          onClick={() => void handleUnarchiveDevice(d)}
                        >
                          {busyId === d.id ? "Restoring…" : "Restore"}
                        </Button>
                      ) : (
                        <span className="ds-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
}
