// apps/cloud-admin/src/pages/DevicesListPage.tsx
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiDeleteDevice, apiGet } from "../lib/api";
import { Button, DataTable, PageHeader } from "../components/ui";
import { DeviceStatusPill } from "../lib/adminStatusPills";

type LicenseInfo = {
  id: string;
  key: string;
  plan: string;
  validFrom: string | null;
  validUntil: string | null;
};

type DeviceRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  fingerprint: string | null;
  customerId: string | null;
  customerName: string | null;
  lastSeenAt: string | null;
  lastHeartbeatAt: string | null;
  createdAt: string;
  licenses?: LicenseInfo[];
};

type DevicesResponse = {
  items: DeviceRow[];
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

const MAX_LICENSES_INLINE = 4;

function deviceDeleteConfirmMessage(hasLicense: boolean): string {
  return hasLicense
    ? "This device is linked to a license. Removing it will free a device slot."
    : "Remove this device? If it is not linked to a license, it will be deleted permanently.";
}

export default function DevicesListPage() {
  const [rows, setRows] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [copiedFingerprint, setCopiedFingerprint] = useState<string | null>(null);

  const loadDevices = useCallback(async () => {
    const res = await apiGet<DevicesResponse>("/devices");
    setRows(res.items ?? []);
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

  async function handleDeleteDevice(device: DeviceRow) {
    const hasLicense = (device.licenses?.length ?? 0) > 0;
    if (!window.confirm(deviceDeleteConfirmMessage(hasLicense))) return;

    setDeleteBusyId(device.id);
    setError(null);
    setSuccess(null);

    try {
      await apiDeleteDevice(device.id);
      setSuccess("Device removed.");
      await loadDevices();
    } catch (err) {
      console.error("Error deleting device", err);
      setError(
        err instanceof Error ? err.message : "Could not remove device.",
      );
    } finally {
      setDeleteBusyId(null);
    }
  }

  const sortedRows = [...rows].sort((a, b) => {
    const ca = (a.customerName ?? "").toLowerCase();
    const cb = (b.customerName ?? "").toLowerCase();
    if (ca !== cb) return ca.localeCompare(cb);
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });

  return (
    <div className="admin-page">
      <PageHeader
        title="Devices"
        subtitle="All registered POS devices — grouped by hardware ID (fingerprint / device ID)."
      />

      {error ? <div className="admin-error-banner">{error}</div> : null}
      {success ? <div className="admin-success-banner">{success}</div> : null}

      <div className="ds-section-block">
        <DataTable>
          <thead>
            <tr>
              <th>Name</th>
              <th>Fingerprint</th>
              <th>Licenses</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Last contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="ds-muted" style={{ textAlign: "center", padding: 24 }}>
                  Loading devices…
                </td>
              </tr>
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="ds-muted" style={{ textAlign: "center", padding: 24 }}>
                  No devices found.
                </td>
              </tr>
            ) : (
              sortedRows.map((d) => {
                const lastContact = d.lastHeartbeatAt || d.lastSeenAt || null;
                const licenses = d.licenses ?? [];

                return (
                  <tr key={d.id}>
                    <td>
                      <div style={{ whiteSpace: "nowrap" }}>{d.name}</div>
                      <div className="ds-muted" style={{ marginTop: 2, textTransform: "uppercase" }}>
                        {d.type}
                      </div>
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
                      {licenses.length === 0 ? (
                        <span className="ds-muted">—</span>
                      ) : (
                        <>
                          {licenses.slice(0, MAX_LICENSES_INLINE).map((lic) => (
                            <div
                              key={lic.id}
                              style={{ fontFamily: "monospace", fontSize: 11, lineHeight: 1.25 }}
                            >
                              {lic.key}{" "}
                              <span className="ds-muted">({lic.plan})</span>
                            </div>
                          ))}
                          {licenses.length > MAX_LICENSES_INLINE ? (
                            <div className="ds-muted" style={{ fontFamily: "monospace", fontSize: 11, marginTop: 4 }}>
                              + {licenses.length - MAX_LICENSES_INLINE} more license(s)
                            </div>
                          ) : null}
                        </>
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
                      <DeviceStatusPill status={d.status} />
                    </td>
                    <td className="ds-muted" style={{ whiteSpace: "nowrap" }}>
                      {formatDateTime(lastContact)}
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        disabled={deleteBusyId === d.id}
                        onClick={() => void handleDeleteDevice(d)}
                      >
                        {deleteBusyId === d.id ? "Removing…" : "Remove"}
                      </Button>
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
