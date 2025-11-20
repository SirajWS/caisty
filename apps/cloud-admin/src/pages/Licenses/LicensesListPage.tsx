// apps/cloud-admin/src/pages/Licenses/LicensesListPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

export default function LicensesListPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);

  // Formular-State
  const today = new Date();
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(today.getFullYear() + 1);

  const [form, setForm] = useState({
    customerId: "",
    plan: "starter",
    maxDevices: "1",
    validFrom: today.toISOString().slice(0, 10),
    validUntil: oneYearLater.toISOString().slice(0, 10),
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

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
      const res = await apiGet<LicenseListResponse>("/licenses");
      setLicenses(res.items);
      setTotal(res.total);
    } catch (err: any) {
      console.error(err);
      setError("Fehler beim Laden der Licenses.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    setCustomersLoading(true);
    try {
      const res = await apiGet<{ items: Customer[] }>("/customers");
      setCustomers(res.items);
      // Default-Kunde, falls noch keiner gesetzt
      if (!form.customerId && res.items.length > 0) {
        setForm((f) => ({ ...f, customerId: res.items[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCustomersLoading(false);
    }
  }

  useEffect(() => {
    loadLicenses();
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    if (!form.customerId) {
      setCreateError("Bitte einen Customer auswählen.");
      return;
    }

    setCreateLoading(true);
    try {
      const payload = {
        customerId: form.customerId,
        plan: form.plan,
        maxDevices: Number(form.maxDevices) || 1,
        validFrom: new Date(form.validFrom).toISOString(),
        validUntil: new Date(form.validUntil).toISOString(),
      };

      await apiPost<typeof payload, { item: License }>("/licenses", payload);

      // Liste neu laden
      await loadLicenses();
    } catch (err: any) {
      console.error(err);
      setCreateError(
        err?.message || "Fehler beim Anlegen der License.",
      );
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Licenses</h1>
      <p className="admin-page-subtitle">
        Übersicht über alle Lizenzschlüssel deiner Organisation.
      </p>

      {/* Formular zum Anlegen */}
      <div
        className="dashboard-card"
        style={{ marginBottom: 24, maxWidth: 900 }}
      >
        <div className="dashboard-card-title">Neue License anlegen</div>
        <form
          onSubmit={handleCreate}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginTop: 12,
          }}
        >
          {/* Customer */}
          <label style={{ fontSize: 13 }}>
            Customer
            <select
              value={form.customerId}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerId: e.target.value }))
              }
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
              disabled={customersLoading}
            >
              {customers.length === 0 && (
                <option value="">(keine Customers)</option>
              )}
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.email} ({c.id.slice(0, 6)}…)
                </option>
              ))}
            </select>
          </label>

          {/* Plan */}
          <label style={{ fontSize: 13 }}>
            Plan
            <select
              value={form.plan}
              onChange={(e) =>
                setForm((f) => ({ ...f, plan: e.target.value }))
              }
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
              <option value="starter">starter</option>
              <option value="pro">pro</option>
            </select>
          </label>

          {/* Max Devices */}
          <label style={{ fontSize: 13 }}>
            Max Devices
            <input
              type="number"
              min={1}
              value={form.maxDevices}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxDevices: e.target.value }))
              }
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
            />
          </label>

          {/* Gültig von */}
          <label style={{ fontSize: 13 }}>
            Gültig von
            <input
              type="date"
              value={form.validFrom}
              onChange={(e) =>
                setForm((f) => ({ ...f, validFrom: e.target.value }))
              }
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
            />
          </label>

          {/* Gültig bis */}
          <label style={{ fontSize: 13 }}>
            Gültig bis
            <input
              type="date"
              value={form.validUntil}
              onChange={(e) =>
                setForm((f) => ({ ...f, validUntil: e.target.value }))
              }
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
            />
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "flex-start",
              marginTop: 4,
            }}
          >
            <button
              type="submit"
              disabled={createLoading}
              className="login-button"
              style={{ width: "auto", paddingInline: 20 }}
            >
              {createLoading ? "Speichern…" : "License erstellen"}
            </button>
          </div>
        </form>

        {createError && (
          <div className="admin-error" style={{ marginTop: 12 }}>
            {createError}
          </div>
        )}
      </div>

      {/* Tabelle */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Max Devices</th>
              <th>Customer</th>
              <th>Gültig bis</th>
              <th>Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7}>Lade Licenses…</td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={7}>
                  <div className="admin-error">{error}</div>
                </td>
              </tr>
            )}
            {!loading && !error && licenses.length === 0 && (
              <tr>
                <td colSpan={7}>Noch keine Licenses vorhanden.</td>
              </tr>
            )}
            {!loading &&
              !error &&
              licenses.map((lic) => (
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
                  <td>{lic.customerId ? `${lic.customerId.slice(0, 8)}…` : "–"}</td>
                  <td>{formatDate(lic.validUntil)}</td>
                  <td>{formatDate(lic.createdAt)}</td>
                </tr>
              ))}
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
        {total} License(s) in dieser Instanz.
      </p>
    </div>
  );
}
