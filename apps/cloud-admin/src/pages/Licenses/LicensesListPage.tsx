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
  // neu: wie viele Devices diese License bereits nutzen
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

type CustomerMode = "none" | "existing" | "new";

type LicenseFormState = {
  customerMode: CustomerMode;
  customerId: string;
  newCustomerName: string;
  plan: string;
  maxDevices: string;
  validFrom: string;
  validUntil: string;
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

  const [form, setForm] = useState<LicenseFormState>({
    customerMode: "none",
    customerId: "",
    newCustomerName: "",
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
    } catch (err) {
      console.error(err);
    } finally {
      setCustomersLoading(false);
    }
  }

  useEffect(() => {
    void loadLicenses();
    void loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function generatePlaceholderEmail(name: string) {
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ".")
      .replace(/[^a-z0-9.]/g, "");
    const localPart = slug || `customer${Date.now()}`;
    return `${localPart}@example.invalid`;
  }

  async function createCustomer(nameRaw: string): Promise<string> {
    const name = nameRaw.trim();
    const email = generatePlaceholderEmail(name);

    const res: any = await apiPost("/customers", {
      name,
      email,
      status: "active",
    });

    const newId: string | undefined = res?.item?.id ?? res?.id;

    if (!newId) {
      throw new Error("Server hat keine Customer-ID zurückgegeben.");
    }

    return newId;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    if (form.customerMode === "new" && !form.newCustomerName.trim()) {
      setCreateError("Bitte einen Namen für den neuen Customer eingeben.");
      return;
    }

    setCreateLoading(true);
    try {
      let customerIdToUse: string | null = null;

      if (form.customerMode === "existing" && form.customerId) {
        customerIdToUse = form.customerId;
      } else if (form.customerMode === "new") {
        customerIdToUse = await createCustomer(form.newCustomerName);
      }

      const payload: any = {
        plan: form.plan,
        maxDevices: Number(form.maxDevices) || 1,
        validFrom: new Date(form.validFrom).toISOString(),
        validUntil: new Date(form.validUntil).toISOString(),
      };

      if (customerIdToUse) {
        payload.customerId = customerIdToUse;
      }

      await apiPost("/licenses", payload);

      // Daten neu laden (Licenses + Customers)
      await Promise.all([loadLicenses(), loadCustomers()]);

      // Formular: Customer-Auswahl zurücksetzen
      setForm((f) => ({
        ...f,
        customerMode: "none",
        customerId: "",
        newCustomerName: "",
      }));
    } catch (err: any) {
      console.error(err);
      setCreateError(err?.message || "Fehler beim Anlegen der License.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!window.confirm("Diesen License-Key wirklich löschen/revoken?")) return;
    try {
      await apiPost(`/licenses/${id}/revoke`, {});
      await loadLicenses();
    } catch (err) {
      console.error(err);
    }
  }

  // Aufteilung:
  // - generierte Keys: noch kein Customer UND devicesCount === 0
  // - alle anderen (Customer gesetzt ODER schon verwendet) → unten in der Hauptliste
  const generatedLicenses = licenses.filter(
    (lic) => !lic.customerId && (lic.devicesCount ?? 0) === 0,
  );
  const assignedLicenses = licenses.filter(
    (lic) => lic.customerId || (lic.devicesCount ?? 0) > 0,
  );

  const customerSelectValue =
    form.customerMode === "existing"
      ? form.customerId
      : form.customerMode === "new"
      ? "__new__"
      : "";

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
        <p
          style={{
            fontSize: 13,
            color: "#9ca3af",
            marginTop: 4,
            marginBottom: 4,
          }}
        >
          Customer ist optional. Ohne Auswahl wird nur ein License-Key erzeugt,
          den du z.&nbsp;B. im POS verwenden kannst.
        </p>

        <form
          onSubmit={handleCreate}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginTop: 12,
          }}
        >
          {/* Customer (optional) */}
          <label style={{ fontSize: 13 }}>
            Customer (optional)
            <select
              value={customerSelectValue}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "__new__") {
                  setForm((f) => ({
                    ...f,
                    customerMode: "new",
                    customerId: "",
                  }));
                } else if (!value) {
                  setForm((f) => ({
                    ...f,
                    customerMode: "none",
                    customerId: "",
                  }));
                } else {
                  setForm((f) => ({
                    ...f,
                    customerMode: "existing",
                    customerId: value,
                  }));
                }
              }}
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
              <option value="">
                — Ohne Customer (nur License-Key) —
              </option>
              <option value="__new__">➕ Neuen Customer anlegen…</option>
              {customers.length === 0 && (
                <option value="" disabled>
                  (keine Customers vorhanden)
                </option>
              )}
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.email} ({c.id.slice(0, 6)}…)
                </option>
              ))}
            </select>

            {form.customerMode === "new" && (
              <div style={{ marginTop: 6 }}>
                <input
                  type="text"
                  placeholder="Name des neuen Customers…"
                  value={form.newCustomerName}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      newCustomerName: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1px solid #374151",
                    backgroundColor: "#020617",
                    color: "#e5e7eb",
                    fontSize: 13,
                  }}
                />
                <div
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    marginTop: 4,
                  }}
                >
                  Der neue Customer wird automatisch angelegt und bekommt
                  diese License.
                </div>
              </div>
            )}
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

      {/* Karte: Generierte Licenses (ohne Customer, noch nicht benutzt) */}
      {generatedLicenses.length > 0 && (
        <div
          className="dashboard-card"
          style={{ marginBottom: 24, maxWidth: 900 }}
        >
          <div className="dashboard-card-title">
            Generierte License-Keys (ohne Customer)
          </div>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              marginTop: 4,
              marginBottom: 8,
            }}
          >
            Diese Keys wurden erzeugt, sind aber noch keinem Customer
            zugeordnet und wurden noch auf keinem Device verwendet. Du kannst
            sie z.&nbsp;B. im POS eintragen. Sobald später ein Customer
            hinterlegt ist oder die License auf einem Device aktiviert wird,
            verschwinden sie aus dieser Liste.
          </p>

          <div className="admin-table-wrapper" style={{ marginTop: 8 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Max Devices</th>
                  <th>Gültig bis</th>
                  <th>Erstellt</th>
                  <th>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {generatedLicenses.map((lic) => (
                  <tr key={lic.id}>
                    <td>{lic.key}</td>
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
                    <td>{formatDate(lic.validUntil)}</td>
                    <td>{formatDate(lic.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleRevoke(lic.id)}
                        className="badge badge--red"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabelle: Licenses mit Customer ODER bereits benutzten Devices */}
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
            {!loading && !error && assignedLicenses.length === 0 && (
              <tr>
                <td colSpan={7}>
                  Noch keine Licenses mit Customer oder Device vorhanden.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              assignedLicenses.map((lic) => (
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
                    {lic.customerId
                      ? `${lic.customerId.slice(0, 8)}…`
                      : "–"}
                  </td>
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
