// apps/cloud-admin/src/pages/Licenses/PortalLicensesPage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiDelete } from "../../lib/api";
import { useTheme, themeColors } from "../../theme/ThemeContext";

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
  const { theme } = useTheme();
  const colors = themeColors[theme];
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
      <h1
        style={{
          fontSize: "32px",
          fontWeight: 700,
          marginBottom: "8px",
          color: colors.text,
          letterSpacing: "-0.5px",
        }}
      >
        Portal-Lizenzen
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: colors.textSecondary,
          marginBottom: "24px",
        }}
      >
        Übersicht über alle automatisch generierten Lizenzen aus dem
        Kundenportal.
      </p>

      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <Link
          to="/licenses"
          style={{
            fontSize: 13,
            color: colors.accent,
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.accentHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.accent;
          }}
        >
          ← zurück zur Übersicht
        </Link>
      </div>

      {/* Filter-Karte */}
      <div
        className="dashboard-card"
        style={{
          marginBottom: 24,
          maxWidth: 900,
          backgroundColor: colors.bgSecondary,
          borderColor: colors.border,
          transition: "background-color 0.3s, border-color 0.3s",
        }}
      >
        <div
          className="dashboard-card-title"
          style={{ color: colors.textSecondary }}
        >
          Filter
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginTop: 12,
          }}
        >
          <label style={{ fontSize: 13, color: colors.text }}>
            Plan
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              style={{
                width: "100%",
                marginTop: 4,
                padding: "6px 8px",
                borderRadius: 6,
                border: `1px solid ${colors.borderSecondary}`,
                backgroundColor: colors.input,
                color: colors.text,
                fontSize: 13,
                transition: "all 0.2s",
              }}
            >
              <option value="all">Alle Pläne</option>
              <option value="trial">trial</option>
              <option value="starter">starter</option>
              <option value="pro">pro</option>
            </select>
          </label>

          <label style={{ fontSize: 13, color: colors.text }}>
            Status
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: "100%",
                marginTop: 4,
                padding: "6px 8px",
                borderRadius: 6,
                border: `1px solid ${colors.borderSecondary}`,
                backgroundColor: colors.input,
                color: colors.text,
                fontSize: 13,
                transition: "all 0.2s",
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
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.bgTertiary,
                color: colors.text,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.bgTertiary;
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
              color: colors.textTertiary,
            }}
          >
            {filteredLicenses.length} von {licenses.length} Lizenzen angezeigt
          </div>
        )}
      </div>

      {/* Tabelle: Portal-Lizenzen */}
      <div
        className="admin-table-wrapper"
        style={{
          backgroundColor: colors.bgSecondary,
          borderColor: colors.border,
          transition: "background-color 0.3s, border-color 0.3s",
        }}
      >
        <table className="admin-table">
          <thead>
            <tr style={{ backgroundColor: colors.bgTertiary }}>
              <th style={{ color: colors.textSecondary }}>Key</th>
              <th style={{ color: colors.textSecondary }}>Plan</th>
              <th style={{ color: colors.textSecondary }}>Status</th>
              <th style={{ color: colors.textSecondary }}>Max Devices</th>
              <th style={{ color: colors.textSecondary }}>Seats</th>
              <th style={{ color: colors.textSecondary }}>Customer</th>
              <th style={{ color: colors.textSecondary }}>Gültig bis</th>
              <th style={{ color: colors.textSecondary }}>Erstellt</th>
              <th style={{ color: colors.textSecondary }}>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    textAlign: "center",
                    padding: 24,
                    color: colors.textSecondary,
                  }}
                >
                  Lade Portal-Lizenzen…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={9}>
                  <div
                    className="admin-error"
                    style={{
                      backgroundColor: colors.errorBg,
                      borderColor: `${colors.error}50`,
                      color: colors.error,
                    }}
                  >
                    {error}
                  </div>
                </td>
              </tr>
            )}
            {!loading && !error && filteredLicenses.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    textAlign: "center",
                    padding: 24,
                    color: colors.textSecondary,
                  }}
                >
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
                  <tr
                    key={lic.id}
                    style={{
                      borderBottomColor: colors.border,
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.bgTertiary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td style={{ color: colors.text }}>
                      <Link
                        to={`/licenses/${lic.id}`}
                        style={{
                          color: colors.accent,
                          textDecoration: "none",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = colors.accentHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = colors.accent;
                        }}
                      >
                        {lic.key}
                      </Link>
                    </td>
                    <td style={{ color: colors.text }}>{lic.plan}</td>
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
                    <td style={{ color: colors.text }}>
                      {lic.maxDevices ?? "–"}
                    </td>
                    <td style={{ color: colors.text }}>
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
                    <td style={{ color: colors.text }}>
                      {lic.customerId ? (
                        <Link
                          to={`/customers/${lic.customerId}`}
                          style={{
                            color: colors.accent,
                            textDecoration: "none",
                            transition: "color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = colors.accentHover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = colors.accent;
                          }}
                        >
                          {customer?.name ||
                            customer?.email ||
                            `${lic.customerId.slice(0, 8)}…`}
                        </Link>
                      ) : (
                        "–"
                      )}
                    </td>
                    <td style={{ color: colors.text }}>
                      {formatDate(lic.validUntil)}
                    </td>
                    <td style={{ color: colors.text }}>
                      {formatDate(lic.createdAt)}
                    </td>
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
          color: colors.textTertiary,
        }}
      >
        {total} Portal-Lizenz(en) in dieser Instanz.
      </p>
    </div>
  );
}

