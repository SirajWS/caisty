// apps/cloud-admin/src/pages/Licenses/LicensesListPage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost, apiDelete } from "../../lib/api";
import {
  Button,
  Card,
  DataTable,
  PageHeader,
  SectionHeader,
  Select,
} from "../../components/ui";
import { LicenseStatusPill, SeatsStatus } from "../../lib/adminStatusPills";

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
  // aus API aggregiert: wie viele Devices nutzen diese License bereits
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

// einfache Plan→maxDevices-Mapping (synchron zu LICENSE_PLANS im Backend)
const PLAN_DEFAULT_MAX_DEVICES: Record<string, string> = {
  trial: "1",
  starter: "1",
  pro: "3",
  business: "", // unlimited — leave empty; API uses null
};

export default function LicensesListPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);

  // Map für schnelle Lookup: customerId → Customer
  const customersById = React.useMemo(() => {
    const map: Record<string, Customer> = {};
    for (const c of customers) {
      map[c.id] = c;
    }
    return map;
  }, [customers]);

  // Formular-State
  const today = new Date();
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(today.getFullYear() + 1);

  const [form, setForm] = useState<LicenseFormState>({
    customerMode: "none",
    customerId: "",
    newCustomerName: "",
    plan: "starter",
    maxDevices: PLAN_DEFAULT_MAX_DEVICES["starter"],
    validFrom: today.toISOString().slice(0, 10),
    validUntil: oneYearLater.toISOString().slice(0, 10),
  });

  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Filter-State
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  function formatDate(value: string | null | undefined) {
    if (!value) return "–";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "–";
    return d.toLocaleString("en-GB");
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
      setError("Failed to load licences.");
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
      throw new Error("Server did not return a customer ID.");
    }

    return newId;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    if (form.customerMode === "new" && !form.newCustomerName.trim()) {
      setCreateError("Please enter a name for the new customer.");
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

      // maxDevices: Business = unlimited (null); else form or plan default
      let maxDevicesPayload: number | null;
      if (form.plan === "business") {
        maxDevicesPayload = null;
      } else {
        let maxDevicesNum = Number(form.maxDevices);
        if (!maxDevicesNum || maxDevicesNum <= 0) {
          const fallback = PLAN_DEFAULT_MAX_DEVICES[form.plan] ?? "1";
          maxDevicesNum = Number(fallback) || 1;
        }
        maxDevicesPayload = maxDevicesNum;
      }

      const payload: any = {
        plan: form.plan,
        maxDevices: maxDevicesPayload,
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
      setCreateError(err?.message || "Failed to create licence.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!window.confirm("Revoke this licence key?")) return;
    try {
      await apiPost(`/licenses/${id}/revoke`, {});
      await loadLicenses();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (
      !window.confirm(
        "Permanently delete this licence? This action cannot be undone.",
      )
    )
      return;
    try {
      await apiDelete(`/licenses/${id}`);
      await loadLicenses();
    } catch (err) {
      console.error(err);
      alert("Failed to delete licence.");
    }
  }

  // Aufteilung:
  // - generierte Keys: noch kein Customer UND devicesCount === 0 UND NICHT revoked
  // - alle anderen (Customer gesetzt ODER schon verwendet) → unten in der Hauptliste
  const generatedLicenses = licenses.filter(
    (lic) =>
      !lic.customerId &&
      (lic.devicesCount ?? 0) === 0 &&
      lic.status !== "revoked",
  );

  const assignedLicenses = licenses.filter(
    (lic) =>
      lic.customerId ||
      (lic.devicesCount ?? 0) > 0 ||
      lic.status === "revoked",
  );

  // Filter anwenden
  const filteredAssignedLicenses = assignedLicenses.filter((lic) => {
    if (filterPlan !== "all" && lic.plan !== filterPlan) return false;
    if (filterStatus !== "all" && lic.status !== filterStatus) return false;
    return true;
  });

  const customerSelectValue =
    form.customerMode === "existing"
      ? form.customerId
      : form.customerMode === "new"
      ? "__new__"
      : "";

  const filterActive = filterPlan !== "all" || filterStatus !== "all";

  return (
    <div className="admin-page">
      <PageHeader
        title="Licences"
        subtitle="Overview of all licence keys in your organisation."
      />

      <div className="ds-section-block" style={{ maxWidth: 900 }}>
        <Card>
          <div style={{ padding: 16 }}>
            <SectionHeader
              title="Create licence"
              subline="Customer is optional. Without a selection, only a licence key is generated for use in POS."
            />

            <form
          onSubmit={handleCreate}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginTop: 12,
          }}
        >
          <label className="ds-form-field">
            Customer (optional)
            <select
              className="ds-select"
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
              disabled={customersLoading}
            >
              <option value="">— No customer (licence key only) —</option>
              <option value="__new__">➕ Create new customer…</option>
              {customers.length === 0 && (
                <option value="" disabled>
                  (no customers available)
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
                  className="ds-input"
                  placeholder="Name of the new customer…"
                  value={form.newCustomerName}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      newCustomerName: e.target.value,
                    }))
                  }
                />
                <div className="ds-muted" style={{ fontSize: 11, marginTop: 4 }}>
                  The new customer will be created automatically and assigned this
                  licence.
                </div>
              </div>
            )}
          </label>

          <label className="ds-form-field">
            Plan
            <select
              className="ds-select"
              value={form.plan}
              onChange={(e) => {
                const nextPlan = e.target.value;
                setForm((f) => ({
                  ...f,
                  plan: nextPlan,
                  maxDevices:
                    PLAN_DEFAULT_MAX_DEVICES[nextPlan] ?? f.maxDevices,
                }));
              }}
            >
              <option value="trial">trial</option>
              <option value="starter">starter</option>
              <option value="pro">pro</option>
            </select>
          </label>

          <label className="ds-form-field">
            Max devices
            <input
              type="number"
              className="ds-input"
              min={1}
              value={form.maxDevices}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxDevices: e.target.value }))
              }
            />
          </label>

          <label className="ds-form-field">
            Valid from
            <input
              type="date"
              className="ds-input"
              value={form.validFrom}
              onChange={(e) =>
                setForm((f) => ({ ...f, validFrom: e.target.value }))
              }
            />
          </label>

          <label className="ds-form-field">
            Valid until
            <input
              type="date"
              className="ds-input"
              value={form.validUntil}
              onChange={(e) =>
                setForm((f) => ({ ...f, validUntil: e.target.value }))
              }
            />
          </label>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <Button type="submit" variant="primary" disabled={createLoading}>
              {createLoading ? "Saving…" : "Create license"}
            </Button>
          </div>
        </form>

        {createError ? (
          <div className="admin-error-banner" style={{ marginTop: 12 }}>
            {createError}
          </div>
        ) : null}
          </div>
        </Card>
      </div>

      {generatedLicenses.length > 0 ? (
        <div className="ds-section-block" style={{ maxWidth: 900 }}>
          <SectionHeader
            title="Generated licence keys (no customer)"
            subline="These keys were created without a customer and have not been used on any device yet. Enter them in POS. Once a customer is assigned or the licence is activated on a device, they move to the main list below."
          />
          <DataTable>
            <thead>
              <tr>
                <th>Key</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Max devices</th>
                <th>Seats</th>
                <th>Valid until</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {generatedLicenses.map((lic) => {
                const used = lic.devicesCount ?? 0;
                const seatTotal =
                  lic.maxDevices === null ? null : (lic.maxDevices ?? used);

                return (
                  <tr key={lic.id}>
                    <td>{lic.key}</td>
                    <td>{lic.plan}</td>
                    <td>
                      <LicenseStatusPill status={lic.status} />
                    </td>
                    <td>
                      {lic.maxDevices === null
                        ? "Unlimited"
                        : (lic.maxDevices ?? "—")}
                    </td>
                    <td>
                      <SeatsStatus used={used} total={seatTotal} />
                    </td>
                    <td>{formatDate(lic.validUntil)}</td>
                    <td>{formatDate(lic.createdAt)}</td>
                    <td>
                      <Button
                        variant="danger"
                        onClick={() => handleRevoke(lic.id)}
                      >
                        Revoke
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        </div>
      ) : null}

      <div className="ds-section-block" style={{ maxWidth: 900 }}>
        <Card>
          <div style={{ padding: 16 }}>
        <SectionHeader title="Filters" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginTop: 12,
          }}
        >
          <label className="ds-form-field">
            Plan
            <Select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
            >
              <option value="all">All plans</option>
              <option value="trial">trial</option>
              <option value="starter">starter</option>
              <option value="pro">pro</option>
            </Select>
          </label>

          <label className="ds-form-field">
            Status
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">active</option>
              <option value="revoked">revoked</option>
              <option value="expired">expired</option>
            </Select>
          </label>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <Button
              variant="secondary"
              onClick={() => {
                setFilterPlan("all");
                setFilterStatus("all");
              }}
            >
              Reset filters
            </Button>
          </div>
        </div>
        {filterActive ? (
          <div className="ds-muted" style={{ marginTop: 12, fontSize: 12 }}>
            {filteredAssignedLicenses.length} of {assignedLicenses.length} licences
            shown
          </div>
        ) : null}
          </div>
        </Card>
      </div>

      {error ? <div className="admin-error-banner">{error}</div> : null}

      <div className="ds-section-block">
        <DataTable>
          <thead>
            <tr>
              <th>Key</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Max devices</th>
              <th>Seats</th>
              <th>Customer</th>
              <th>Valid until</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  className="ds-muted"
                  style={{ textAlign: "center", padding: 24 }}
                >
                  Loading licences…
                </td>
              </tr>
            ) : !loading && !error && filteredAssignedLicenses.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="ds-muted"
                  style={{ textAlign: "center", padding: 24 }}
                >
                  {assignedLicenses.length === 0
                    ? "No licences with a customer or device yet."
                    : "No licences match the selected filters."}
                </td>
              </tr>
            ) : (
              !loading &&
              !error &&
              filteredAssignedLicenses.map((lic) => {
                const used = lic.devicesCount ?? 0;
                const seatTotal =
                  lic.maxDevices === null ? null : (lic.maxDevices ?? used);
                const customer = lic.customerId
                  ? customersById[lic.customerId]
                  : undefined;

                return (
                  <tr key={lic.id}>
                    <td>
                      <Link to={`/licenses/${lic.id}`} className="ds-link">
                        {lic.key}
                      </Link>
                    </td>
                    <td>{lic.plan}</td>
                    <td>
                      <LicenseStatusPill status={lic.status} />
                    </td>
                    <td>
                      {lic.maxDevices === null
                        ? "Unlimited"
                        : (lic.maxDevices ?? "—")}
                    </td>
                    <td>
                      <SeatsStatus used={used} total={seatTotal} />
                    </td>
                    <td>
                      {lic.customerId ? (
                        <Link
                          to={`/customers/${lic.customerId}`}
                          className="ds-link"
                        >
                          {customer?.name ||
                            customer?.email ||
                            `${lic.customerId.slice(0, 8)}…`}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{formatDate(lic.validUntil)}</td>
                    <td>{formatDate(lic.createdAt)}</td>
                    <td>
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(lic.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </DataTable>
      </div>

      <p className="ds-muted" style={{ marginTop: 8, fontSize: 12 }}>
        {total} licence(s) in this instance.
      </p>
    </div>
  );
}
