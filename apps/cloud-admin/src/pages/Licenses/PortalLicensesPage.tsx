// apps/cloud-admin/src/pages/Licenses/PortalLicensesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiDelete } from "../../lib/api";
import {
  Button,
  DataTable,
  PageHeader,
  Select,
  Toolbar,
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

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB");
}

export default function PortalLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);

  const customersById = useMemo(() => {
    const map: Record<string, Customer> = {};
    for (const c of customers) {
      map[c.id] = c;
    }
    return map;
  }, [customers]);

  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  async function loadLicenses() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<LicenseListResponse>("/licenses/portal");
      setLicenses(res.items);
      setTotal(res.total);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load portal licences.");
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
        "Permanently delete this portal licence? This action cannot be undone.",
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

  const filteredLicenses = licenses.filter((lic) => {
    if (filterPlan !== "all" && lic.plan !== filterPlan) return false;
    if (filterStatus !== "all" && lic.status !== filterStatus) return false;
    return true;
  });

  const toolbarFooter =
    filterPlan !== "all" || filterStatus !== "all"
      ? `${filteredLicenses.length} of ${licenses.length} licences shown`
      : `${total} portal licence(s) in this instance.`;

  return (
    <div className="admin-page">
      <PageHeader
        title="Portal licences"
        subtitle="Overview of all automatically generated licences from the customer portal."
      />

      <p className="ds-muted" style={{ marginBottom: 16 }}>
        <Link to="/licenses" className="ds-link">
          ← Back to overview
        </Link>
      </p>

      <Toolbar footer={toolbarFooter}>
        <Select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
        >
          <option value="all">All plans</option>
          <option value="trial">trial</option>
          <option value="starter">starter</option>
          <option value="pro">pro</option>
        </Select>

        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="active">active</option>
          <option value="revoked">revoked</option>
          <option value="expired">expired</option>
        </Select>

        <Button
          variant="secondary"
          onClick={() => {
            setFilterPlan("all");
            setFilterStatus("all");
          }}
        >
          Reset filters
        </Button>
      </Toolbar>

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
                  Loading portal licences…
                </td>
              </tr>
            ) : !error && filteredLicenses.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="ds-muted"
                  style={{ textAlign: "center", padding: 24 }}
                >
                  {licenses.length === 0
                    ? "No portal licences yet."
                    : "No licences match the selected filters."}
                </td>
              </tr>
            ) : (
              !error &&
              filteredLicenses.map((lic) => {
                const used = lic.devicesCount ?? 0;
                const seatTotal = lic.maxDevices ?? used;
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
                    <td>{lic.maxDevices ?? "—"}</td>
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
    </div>
  );
}
