// apps/cloud-admin/src/pages/Licenses/PortalLicensesPage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiDelete } from "../../lib/api";

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
};

type LicenseListResponse = {
  items: License[];
  total: number;
};

type Customer = {
  id: string;
  name: string | null;
  email: string;
};

export default function PortalLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);

  // Map für schnelle Lookup: customerId → Customer
  const customersById = React.useMemo(() => {
    const map: Record<string, Customer> = {};
    for (const c of customers) {
      map[c.id] = c;
    }
    return map;
  }, [customers]);

  // Filter-State
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  function formatDate(value: string | null | undefined) {
    if (!value) return "–";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "–";
    return d.toLocaleString("de-DE");
  }

  async function loadLicenses() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<LicenseListResponse>("/licenses/portal");
      setLicenses(res.items);
      setTotal(res.total);
    } catch (err: any) {
      console.error(err);
      setError("Fehler beim Laden der Portal-Lizenzen.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const res = await apiGet<{ items: Customer[] }>("/customers");
      setCustomers(res.items);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    void loadLicenses();
    void loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    if (
      !window.confirm(
        "Diese Portal-Lizenz wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
      )
    )
      return;
    try {
      await apiDelete(`/licenses/${id}`);
      await loadLicenses();
    } catch (err) {
      console.error(err);
      alert("Fehler beim Löschen der Lizenz.");
    }
  }

  // Filter anwenden
  const filteredLicenses = licenses.filter((lic) => {
    if (filterPlan !== "all" && lic.plan !== filterPlan) return false;
    if (filterStatus !== "all" && lic.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Portal-Lizenzen</h1>
      <p className="admin-page-subtitle">
        Übersicht über alle automatisch generierten Lizenzen aus dem
        Kundenportal.
      </p>

      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <Link
          to="/licenses"
          style={{ fontSize: 13, color: "#a855f7", textDecoration: "none" }}
        >
          ← zurück zur Übersicht
        </Link>
      </div>

      {/* Filter-Karte */}
      <div
        className="dashboard-card"
        style={{ marginBottom: 24, maxWidth: 900 }}
      >
        <div className="dashboard-card-title">Filter</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginTop: 12,
          }}
        >
          <label style={{ fontSize: 13 }}>
            Plan
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              style={{
                width: "100%",
                marginTop: 4,
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #374151",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                fontSize: 13,
              }}
            >
              <option value="all">Alle Pläne</option>
              <option value="trial">trial</option>
              <option value="starter">starter</option>
              <option value="pro">pro</option>
            </select>
          </label>

          <label style={{ fontSize: 13 }}>
            Status
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: "100%",
                marginTop: 4,
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #374151",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                fontSize: 13,
              }}
            >
              <option value="all">Alle Status</option>
              <option value="active">active</option>
              <option value="revoked">revoked</option>
              <option value="expired">expired</option>
            </select>
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "flex-start",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setFilterPlan("all");
                setFilterStatus("all");
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #374151",
                backgroundColor: "#1f2937",
                color: "#e5e7eb",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Filter zurücksetzen
            </button>
          </div>
        </div>
        {(filterPlan !== "all" || filterStatus !== "all") && (
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "#9ca3af",
            }}
          >
            {filteredLicenses.length} von {licenses.length} Lizenzen angezeigt
          </div>
        )}
      </div>

      {/* Tabelle: Portal-Lizenzen */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Max Devices</th>
              <th>Seats</th>
              <th>Customer</th>
              <th>Gültig bis</th>
              <th>Erstellt</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9}>Lade Portal-Lizenzen…</td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={9}>
                  <div className="admin-error">{error}</div>
                </td>
              </tr>
            )}
            {!loading && !error && filteredLicenses.length === 0 && (
              <tr>
                <td colSpan={9}>
                  {licenses.length === 0
                    ? "Noch keine Portal-Lizenzen vorhanden."
                    : "Keine Lizenzen entsprechen den ausgewählten Filtern."}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              filteredLicenses.map((lic) => {
                const used = lic.devicesCount ?? 0;
                const total = lic.maxDevices ?? used;
                const full = total > 0 && used >= total;
                const customer = lic.customerId
                  ? customersById[lic.customerId]
                  : undefined;

                return (
                  <tr key={lic.id}>
                    <td>
                      <Link to={`/licenses/${lic.id}`}>{lic.key}</Link>
                    </td>
                    <td>{lic.plan}</td>
                    <td>
                      <span
                        className={
                          lic.status === "active"
                            ? "badge badge--green"
                            : lic.status === "revoked"
                            ? "badge badge--red"
                            : "badge badge--amber"
                        }
                      >
                        {lic.status}
                      </span>
                    </td>
                    <td>{lic.maxDevices ?? "–"}</td>
                    <td>
                      {used} / {total}
                      {full && (
                        <span
                          className="badge badge--red"
                          style={{ marginLeft: 6 }}
                        >
                          voll
                        </span>
                      )}
                    </td>
                    <td>
                      {lic.customerId ? (
                        <Link to={`/customers/${lic.customerId}`}>
                          {customer?.name ||
                            customer?.email ||
                            `${lic.customerId.slice(0, 8)}…`}
                        </Link>
                      ) : (
                        "–"
                      )}
                    </td>
                    <td>{formatDate(lic.validUntil)}</td>
                    <td>{formatDate(lic.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDelete(lic.id)}
                        className="badge badge--red"
                        style={{ cursor: "pointer" }}
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <p
        style={{
          marginTop: 8,
          fontSize: 12,
          color: "#6b7280",
        }}
      >
        {total} Portal-Lizenz(en) in dieser Instanz.
      </p>
    </div>
  );
}

