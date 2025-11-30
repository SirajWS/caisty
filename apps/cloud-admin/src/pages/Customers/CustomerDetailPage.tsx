// apps/cloud-admin/src/pages/Customers/CustomerDetailPage.tsx
import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet } from "../../lib/api";

type CloudCustomerProfile = {
  accountName?: string;
  legalName?: string;
  externalId?: string;
  contact?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  address?: {
    country?: string;
    city?: string;
    street?: string;
    zip?: string;
  };
  language?: string;
  notes?: string;
  lastSyncAt?: string;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  status?: string | null;
  createdAt?: string | null;
  profile?: CloudCustomerProfile | null;
};

type Subscription = {
  id: string;
  customerId: string;
  plan: string;
  status: string;
  createdAt?: string | null;
};

type License = {
  id: string;
  customerId: string;
  key: string;
  plan: string;
  status: string;
  maxDevices: number | null;
  validUntil?: string | null;
  createdAt?: string | null;
};

// Rohdaten aus /devices (aggregiert oder nicht – wir gruppieren nach Fingerprint)
type DeviceRow = {
  id: string;
  customerId: string | null;
  name: string;
  type: string;
  status: string;
  licenseId?: string | null;
  fingerprint?: string | null;
  lastHeartbeatAt?: string | null;
  createdAt?: string | null;
};

// Aggregierte Device-Ansicht pro Hardware-Gerät
type Device = {
  id: string; // Gruppenschlüssel (fingerprint oder Fallback id)
  fingerprint?: string | null;
  name: string;
  type: string;
  status: string;
  licenseIds: string[];
  lastHeartbeatAt?: string | null;
  createdAt?: string | null;
};

type CustomerResponse = { item: Customer };

type ListResponse<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("de-DE");
}

function hasProfileData(profile?: CloudCustomerProfile | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.accountName ||
      profile.legalName ||
      profile.externalId ||
      profile.language ||
      profile.notes ||
      profile.contact?.firstName ||
      profile.contact?.lastName ||
      profile.contact?.email ||
      profile.contact?.phone ||
      profile.address?.country ||
      profile.address?.city ||
      profile.address?.street ||
      profile.address?.zip,
  );
}

export default function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const customerIdParam = customerId as string; // customerId ist bereits geprüft

        const [customerRes, subsRes, licRes, devRes] = await Promise.all([
          apiGet<CustomerResponse>(`/customers/${customerIdParam}`),
          apiGet<ListResponse<Subscription>>("/subscriptions"),
          apiGet<ListResponse<License>>(`/licenses?customerId=${encodeURIComponent(customerIdParam)}`),
          apiGet<ListResponse<DeviceRow>>("/devices"),
        ]);

        if (cancelled) return;

        setCustomer(customerRes.item);
        setSubscriptions(
          (subsRes.items ?? []).filter((s) => s.customerId === customerId),
        );
        // Licenses sind bereits nach customerId gefiltert
        setLicenses(licRes.items ?? []);

        // Devices nur für diesen Kunden, dann nach fingerprint gruppieren
        const rowsForCustomer = (devRes.items ?? []).filter(
          (d) => d.customerId === customerId,
        );

        const grouped: Record<string, Device> = {};

        for (const row of rowsForCustomer) {
          const groupKey = row.fingerprint || row.id;
          const existing = grouped[groupKey];

          if (!existing) {
            grouped[groupKey] = {
              id: groupKey,
              fingerprint: row.fingerprint,
              name: row.name,
              type: row.type,
              status: row.status,
              licenseIds: row.licenseId ? [row.licenseId] : [],
              lastHeartbeatAt: row.lastHeartbeatAt,
              createdAt: row.createdAt,
            };
          } else {
            // Status: "active" gewinnt
            if (row.status === "active") {
              existing.status = row.status;
            }

            // Letztes Signal: neuestes Datum
            if (row.lastHeartbeatAt) {
              const newTs = new Date(row.lastHeartbeatAt).getTime();
              const oldTs = existing.lastHeartbeatAt
                ? new Date(existing.lastHeartbeatAt).getTime()
                : 0;
              if (!Number.isNaN(newTs) && newTs > oldTs) {
                existing.lastHeartbeatAt = row.lastHeartbeatAt;
              }
            }

            // createdAt: frühestes Datum
            if (row.createdAt) {
              const newTs = new Date(row.createdAt).getTime();
              const oldTs = existing.createdAt
                ? new Date(existing.createdAt).getTime()
                : Number.POSITIVE_INFINITY;
              if (!Number.isNaN(newTs) && newTs < oldTs) {
                existing.createdAt = row.createdAt;
              }
            }

            if (row.licenseId && !existing.licenseIds.includes(row.licenseId)) {
              existing.licenseIds.push(row.licenseId);
            }
          }
        }

        const aggregatedDevices = Object.values(grouped).sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });

        setDevices(aggregatedDevices);
      } catch (err) {
        console.error("Error loading customer detail", err);
        if (!cancelled) {
          setError("Fehler beim Laden der Kundendetails.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const subscriptionsCount = subscriptions.length;
  const licensesCount = licenses.length;
  const devicesCount = devices.length;

  const activeDevices = useMemo(
    () => devices.filter((d) => d.status === "active").length,
    [devices],
  );

  const mainLicense = useMemo(() => {
    if (licenses.length === 0) return null;
    const active = licenses.find((l) => l.status === "active");
    return active ?? licenses[0];
  }, [licenses]);

  if (!customerId) {
    return (
      <div className="admin-page">
        <p>Kunden-ID fehlt in der URL.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Customer Details</h1>
      <p className="admin-page-subtitle">
        Basisdaten und zugehörige Subscriptions, Licenses und Devices.
      </p>

      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <Link
          to="/customers"
          style={{ fontSize: 13, color: "#a855f7", textDecoration: "none" }}
        >
          ← zurück zur Übersicht
        </Link>
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      {loading ? (
        <div className="admin-card" style={{ padding: 24 }}>
          Lädt Kundendaten…
        </div>
      ) : !customer ? (
        <div className="admin-card" style={{ padding: 24 }}>
          Kunde wurde nicht gefunden.
        </div>
      ) : (
        <>
          {/* Customer-Card */}
          <div className="admin-card" style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  {customer.name}
                </div>
                <div style={{ fontSize: 14, color: "#9ca3af" }}>
                  {customer.email}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 24,
                    marginTop: 16,
                    fontSize: 13,
                  }}
                >
                  <div>
                    <div style={{ color: "#9ca3af" }}>Status</div>
                    <div>
                      <span
                        className={`status-badge status-${
                          customer.status ?? "unknown"
                        }`}
                      >
                        {customer.status ?? "—"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#9ca3af" }}>Erstellt am</div>
                    <div>{formatDate(customer.createdAt)}</div>
                  </div>
                </div>
              </div>

              {/* Kleine Stats rechts */}
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  fontSize: 13,
                  textAlign: "right",
                }}
              >
                <div>
                  <div style={{ color: "#9ca3af" }}>Plan</div>
                  <div style={{ fontWeight: 600 }}>
                    {mainLicense ? mainLicense.plan.toUpperCase() : "—"}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    {mainLicense?.validUntil
                      ? `gültig bis ${formatDate(mainLicense.validUntil)}`
                      : "ohne Ablaufdatum"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#9ca3af" }}>Subscriptions</div>
                  <div>{subscriptionsCount}</div>
                </div>
                <div>
                  <div style={{ color: "#9ca3af" }}>Licenses</div>
                  <div>{licensesCount}</div>
                </div>
                <div>
                  <div style={{ color: "#9ca3af" }}>Devices (aktiv)</div>
                  <div>
                    {activeDevices} / {devicesCount}
                  </div>
                </div>
              </div>
            </div>

            {/* POS-Profil aus CloudCustomer / Account */}
            {hasProfileData(customer.profile ?? undefined) && (
              <div
                style={{
                  marginTop: 24,
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
                  gap: 24,
                  fontSize: 13,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    Account &amp; Store (POS)
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "120px minmax(0, 1fr)",
                      rowGap: 4,
                      columnGap: 8,
                    }}
                  >
                    <div style={{ color: "#9ca3af" }}>Account-Name</div>
                    <div>
                      {customer.profile?.accountName || customer.name || "—"}
                    </div>
                    <div style={{ color: "#9ca3af" }}>Firma</div>
                    <div>{customer.profile?.legalName || "—"}</div>
                    <div style={{ color: "#9ca3af" }}>Externe ID</div>
                    <div>{customer.profile?.externalId || "—"}</div>
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    Kontakt &amp; Standort
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "120px minmax(0, 1fr)",
                      rowGap: 4,
                      columnGap: 8,
                    }}
                  >
                    <div style={{ color: "#9ca3af" }}>Kontakt</div>
                    <div>
                      {(customer.profile?.contact?.firstName ||
                        customer.profile?.contact?.lastName) && (
                        <>
                          {customer.profile?.contact?.firstName}{" "}
                          {customer.profile?.contact?.lastName}
                          <br />
                        </>
                      )}
                      {customer.profile?.contact?.email || "—"}
                    </div>
                    <div style={{ color: "#9ca3af" }}>Telefon</div>
                    <div>{customer.profile?.contact?.phone || "—"}</div>
                    <div style={{ color: "#9ca3af" }}>Ort</div>
                    <div>
                      {customer.profile?.address?.city || "—"},{" "}
                      {customer.profile?.address?.country || "—"}
                    </div>
                    <div style={{ color: "#9ca3af" }}>Sprache</div>
                    <div>{customer.profile?.language || "—"}</div>
                  </div>
                </div>

                {customer.profile?.notes && (
                  <div style={{ gridColumn: "1 / span 2", marginTop: 8 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      interne Notizen (POS)
                    </div>
                    <div style={{ fontSize: 13 }}>
                      {customer.profile.notes}
                    </div>
                  </div>
                )}

                {customer.profile?.lastSyncAt && (
                  <div
                    style={{
                      gridColumn: "1 / span 2",
                      fontSize: 11,
                      color: "#9ca3af",
                      marginTop: 4,
                    }}
                  >
                    Letzte Aktualisierung aus dem POS:{" "}
                    {formatDate(customer.profile.lastSyncAt)}
                  </div>
                )}
              </div>
            )}

            {!hasProfileData(customer.profile ?? undefined) && (
              <div
                style={{
                  marginTop: 16,
                  fontSize: 12,
                  color: "#9ca3af",
                }}
              >
                Noch keine Details aus dem POS empfangen. Sobald ein Gerät mit
                dieser Lizenz gebunden wird, erscheinen hier Daten aus{" "}
                <strong>Cloud Customer / Account</strong>.
              </div>
            )}
          </div>

          {/* Subscriptions-Table */}
          <div className="admin-card" style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h2 className="admin-section-title">Subscriptions</h2>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Erstellt am</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 16 }}>
                      Keine Subscriptions für diesen Kunden.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id.slice(0, 8)}…</td>
                      <td>{s.plan}</td>
                      <td>
                        <span className={`status-badge status-${s.status}`}>
                          {s.status}
                        </span>
                      </td>
                      <td>{formatDate(s.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Licenses-Table */}
          <div className="admin-card" style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h2 className="admin-section-title">Licenses</h2>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Max Devices</th>
                  <th>Gültig bis</th>
                  <th>Erstellt am</th>
                </tr>
              </thead>
              <tbody>
                {licenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                      Keine Licenses für diesen Kunden.
                    </td>
                  </tr>
                ) : (
                  licenses.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <Link
                          to={`/licenses/${l.id}`}
                          style={{ color: "#a855f7" }}
                        >
                          {l.key}
                        </Link>
                      </td>
                      <td>{l.plan}</td>
                      <td>
                        <span className={`status-badge status-${l.status}`}>
                          {l.status}
                        </span>
                      </td>
                      <td>{l.maxDevices ?? "—"}</td>
                      <td>{formatDate(l.validUntil)}</td>
                      <td>{formatDate(l.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Devices-Table */}
          <div className="admin-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h2 className="admin-section-title">Devices</h2>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Typ</th>
                  <th>Status</th>
                  <th>License(s)</th>
                  <th>Letztes Signal</th>
                  <th>Erstellt am</th>
                </tr>
              </thead>
              <tbody>
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                      Keine Devices für diesen Kunden.
                    </td>
                  </tr>
                ) : (
                  devices.map((d) => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td>{d.type}</td>
                      <td>
                        <span className={`status-badge status-${d.status}`}>
                          {d.status}
                        </span>
                      </td>
                      <td>
                        {d.licenseIds.length === 0
                          ? "—"
                          : d.licenseIds.map((licenseId) => {
                              const lic = licenses.find(
                                (l) => l.id === licenseId,
                              );
                              if (!lic) {
                                return (
                                  <div key={licenseId ?? "unknown"}>
                                    License
                                  </div>
                                );
                              }
                              return (
                                <div key={lic.id}>
                                  <Link
                                    to={`/licenses/${lic.id}`}
                                    style={{ color: "#a855f7" }}
                                  >
                                    {lic.key}
                                  </Link>
                                  <span
                                    style={{
                                      marginLeft: 4,
                                      fontSize: 11,
                                      color: "#9ca3af",
                                    }}
                                  >
                                    ({lic.plan})
                                  </span>
                                </div>
                              );
                            })}
                      </td>
                      <td>{formatDate(d.lastHeartbeatAt)}</td>
                      <td>{formatDate(d.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
