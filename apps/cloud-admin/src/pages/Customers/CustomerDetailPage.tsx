// apps/cloud-admin/src/pages/Customers/CustomerDetailPage.tsx
import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet } from "../../lib/api";

type Customer = {
  id: string;
  name: string;
  email: string;
  status?: string | null;
  createdAt?: string | null;
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

type Device = {
  id: string;
  customerId: string;
  name: string;
  type: string;
  status: string;
  licenseId?: string | null;
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

        const [customerRes, subsRes, licRes, devRes] = await Promise.all([
          apiGet<CustomerResponse>(`/customers/${customerId}`),
          apiGet<ListResponse<Subscription>>("/subscriptions"),
          apiGet<ListResponse<License>>("/licenses"),
          apiGet<ListResponse<Device>>("/devices"),
        ]);

        if (cancelled) return;

        setCustomer(customerRes.item);
        setSubscriptions(
          (subsRes.items ?? []).filter((s) => s.customerId === customerId),
        );
        setLicenses(
          (licRes.items ?? []).filter((l) => l.customerId === customerId),
        );
        setDevices(
          (devRes.items ?? []).filter((d) => d.customerId === customerId),
        );
      } catch (err) {
        console.error("Error loading customer detail", err);
        if (!cancelled) {
          setError("Fehler beim Laden der Kundendetails.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

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

  function formatDate(value?: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleString("de-DE");
  }

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
                        className={`status-badge status-${customer.status ?? "unknown"}`}
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
                  <th>License</th>
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
                        {d.licenseId ? (
                          <Link
                            to={`/licenses/${d.licenseId}`}
                            style={{ color: "#a855f7" }}
                          >
                            {licenses.find((l) => l.id === d.licenseId)?.key ??
                              "License"}
                          </Link>
                        ) : (
                          "—"
                        )}
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
