// apps/cloud-admin/src/pages/Customers/CustomerDetailPage.tsx
import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { apiDeleteDevice, apiGet } from "../../lib/api";
import {
  Button,
  Card,
  DataTable,
  FiscalStatusPill,
  PageHeader,
} from "../../components/ui";
import {
  AccountStatusPill,
  DeviceStatusPill,
  LicenseStatusPill,
  SubscriptionStatusPill,
} from "../../lib/adminStatusPills";
import {
  FISCAL_ACTION_TOOLTIP,
  formatFiscalDate,
  formatProviderLabel,
  formatReceiptMode,
  providerTypeLabel,
} from "../../lib/caistyTerminology";
import type { AdminFiscalOverviewItem } from "../../lib/fiscalApi";

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
  deviceId: string; // echte DB-ID für DELETE
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

type AdminFiscalConfig = {
  country: string | null;
  currency: string;
  fiscalRequired: boolean;
  provider: string;
  providerType: string;
  providerName: string | null;
  providerLabel: string;
  fiscalStatus: string;
  fiscalEnvironment: string;
  receiptMode: string;
  fiscalProfileKey: string;
  fiscalConfigurationLabel: string;
  posConfigurationStatus: string;
  posDownloadAllowed: boolean;
  supportedExports: string[];
  fiscalNotice: string | null;
  mode: string;
  lastSyncAt: string | null;
  actions: {
    startSetup: boolean;
    markActive: boolean;
    markPending: boolean;
    viewLogs: boolean;
  };
};

type AdminBusinessConfig = {
  companyName: string;
  legalName: string;
  country: string | null;
  currency: string;
  defaultLanguage: string;
  street: string;
  city: string;
  postalCode: string;
  vatId: string;
  taxNumber: string;
  configVersion: number;
  updatedAt: string;
  complianceStatus: string;
};

type AdminFiscalResponse = {
  ok: boolean;
  business?: AdminBusinessConfig;
  fiscal?: AdminFiscalConfig;
};

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
  return d.toLocaleString("en-GB");
}

function fiscalForPill(
  fiscal: AdminFiscalConfig,
  customerId: string,
  customer: Customer,
): AdminFiscalOverviewItem {
  return {
    ...fiscal,
    customerId,
    customerName: customer.name,
    customerEmail: customer.email,
    orgId: "",
  };
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
  const [fiscal, setFiscal] = useState<AdminFiscalConfig | null>(null);
  const [business, setBusiness] = useState<AdminBusinessConfig | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);

  const loadCustomerData = useCallback(async () => {
    if (!customerId) return;

    const customerIdParam = customerId;

    const [customerRes, subsRes, licRes, devRes, fiscalRes] = await Promise.all([
      apiGet<CustomerResponse>(`/customers/${customerIdParam}`),
      apiGet<ListResponse<Subscription>>("/subscriptions"),
      apiGet<ListResponse<License>>(
        `/licenses?customerId=${encodeURIComponent(customerIdParam)}`,
      ),
      apiGet<ListResponse<DeviceRow>>("/devices"),
      apiGet<AdminFiscalResponse>(
        `/admin/fiscal/customers/${encodeURIComponent(customerIdParam)}`,
      ).catch(() => ({ ok: false as const })),
    ]);

    setCustomer(customerRes.item);
    setFiscal(fiscalRes.ok && fiscalRes.fiscal ? fiscalRes.fiscal : null);
    setBusiness(fiscalRes.ok && fiscalRes.business ? fiscalRes.business : null);
    setSubscriptions(
      (subsRes.items ?? []).filter((s) => s.customerId === customerId),
    );
    setLicenses(licRes.items ?? []);

    const rowsForCustomer = (devRes.items ?? []).filter(
      (d) => d.customerId === customerId,
    );

    const grouped: Record<string, Device> = {};

    for (const row of rowsForCustomer) {
      const groupKey = row.fingerprint || row.id;
      const existing = grouped[groupKey];

      if (!existing) {
        grouped[groupKey] = {
          deviceId: row.id,
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
        if (row.status === "active") {
          existing.status = row.status;
        }

        if (row.lastHeartbeatAt) {
          const newTs = new Date(row.lastHeartbeatAt).getTime();
          const oldTs = existing.lastHeartbeatAt
            ? new Date(existing.lastHeartbeatAt).getTime()
            : 0;
          if (!Number.isNaN(newTs) && newTs > oldTs) {
            existing.lastHeartbeatAt = row.lastHeartbeatAt;
          }
        }

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
  }, [customerId]);

  useEffect(() => {
    if (!customerId) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        await loadCustomerData();
      } catch (err) {
        console.error("Error loading customer detail", err);
        if (!cancelled) {
          setError("Failed to load customer details.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [customerId, loadCustomerData]);

  async function handleDeleteDevice(device: Device) {
    const hasLicense = device.licenseIds.length > 0;
    const confirmed = window.confirm(
      hasLicense
        ? "This device is linked to a license. Removing it will free a device slot."
        : "Remove this device? If it is not linked to a license, it will be deleted permanently.",
    );
    if (!confirmed) return;

    setDeleteBusyId(device.deviceId);
    setError(null);
    setSuccess(null);

    try {
      await apiDeleteDevice(device.deviceId);
      setSuccess("Device removed.");
      await loadCustomerData();
    } catch (err) {
      console.error("Error deleting device", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete device.",
      );
    } finally {
      setDeleteBusyId(null);
    }
  }

  const subscriptionsCount = subscriptions.length;
  const licensesCount = licenses.length;
  const devicesCount = devices.length;

  const mainLicense = useMemo(() => {
    if (licenses.length === 0) return null;
    const active = licenses.find((l) => l.status === "active");
    return active ?? licenses[0];
  }, [licenses]);

  const deviceSlotLimit = mainLicense?.maxDevices ?? null;

  if (!customerId) {
    return (
      <div className="admin-page">
        <p>Customer ID missing from URL.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="Customer Details"
        subtitle="Basic data and associated subscriptions, licenses, and devices."
      />

      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <Link to="/customers" className="ds-link">
          ← Back to overview
        </Link>
      </div>

      {error && <div className="admin-error-banner">{error}</div>}
      {success && (
        <div
          className="admin-error-banner"
          style={{
            color: "#86efac",
            background: "rgba(34, 197, 94, 0.1)",
            borderColor: "rgba(34, 197, 94, 0.3)",
            marginBottom: 16,
          }}
        >
          {success}
        </div>
      )}

      {loading ? (
        <Card>
          <div style={{ padding: 24 }}>Loading customer data…</div>
        </Card>
      ) : !customer ? (
        <Card>
          <div style={{ padding: 24 }}>Customer not found.</div>
        </Card>
      ) : (
        <>
          {/* Account */}
          <div style={{ marginBottom: 24 }}>
          <Card>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "#9ca3af",
                marginBottom: 12,
              }}
            >
              Account
            </div>
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
                      <AccountStatusPill status={customer.status} />
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#9ca3af" }}>Created</div>
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
                      ? `valid until ${formatDate(mainLicense.validUntil)}`
                      : "no expiry date"}
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
                  <div style={{ color: "#9ca3af" }}>Devices</div>
                  <div>
                    {devicesCount}
                    {deviceSlotLimit != null ? ` / ${deviceSlotLimit}` : ""}
                  </div>
                </div>
              </div>
            </div>

            {/* Business (cloud — Customer Portal source of truth) */}
            <div style={{ marginTop: 24 }}>
              <Card>
                <div style={{ padding: 20, fontSize: 13 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                    Business
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 12 }}>
                    Merchant-editable in Customer Portal · Cloud-managed · POS read-only
                  </div>
                  {!business && !fiscal ? (
                    <div style={{ color: "#9ca3af" }}>
                      No business profile yet. Merchant must complete Business in the Customer Portal.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "160px minmax(0, 1fr)",
                        rowGap: 6,
                        columnGap: 8,
                      }}
                    >
                      <div style={{ color: "#9ca3af" }}>Company</div>
                      <div>{business?.companyName || "—"}</div>
                      <div style={{ color: "#9ca3af" }}>Legal name</div>
                      <div>{business?.legalName || "—"}</div>
                      <div style={{ color: "#9ca3af" }}>Country</div>
                      <div>{business?.country ?? fiscal?.country ?? "—"}</div>
                      <div style={{ color: "#9ca3af" }}>Currency</div>
                      <div>{business?.currency ?? fiscal?.currency ?? "—"}</div>
                      <div style={{ color: "#9ca3af" }}>Language</div>
                      <div>{business?.defaultLanguage ?? "—"}</div>
                      <div style={{ color: "#9ca3af" }}>Address</div>
                      <div>
                        {[business?.street, business?.postalCode, business?.city]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </div>
                      <div style={{ color: "#9ca3af" }}>VAT / Tax</div>
                      <div>
                        {[business?.vatId, business?.taxNumber]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </div>
                      <div style={{ color: "#9ca3af" }}>Config version</div>
                      <div>{business?.configVersion ?? "—"}</div>
                      <div style={{ color: "#9ca3af" }}>Compliance</div>
                      <div>{business?.complianceStatus ?? "—"}</div>
                      <div style={{ color: "#9ca3af" }}>Last updated</div>
                      <div>{formatDate(business?.updatedAt)}</div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Fiscal */}
            <div style={{ marginTop: 24 }}>
              <Card>
                <div style={{ padding: 20, fontSize: 13 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 16,
                      flexWrap: "wrap",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                        Fiscal
                      </div>
                      <div style={{ color: "#9ca3af", fontSize: 12 }}>
                        Cloud fiscal configuration · internal staff view
                      </div>
                    </div>
                    {customerId ? (
                      <Link
                        to={`/fiscal?customerId=${encodeURIComponent(customerId)}`}
                        className="ds-link"
                      >
                        Open Fiscal Dashboard
                      </Link>
                    ) : null}
                  </div>

                  {!fiscal ? (
                    <div style={{ color: "#9ca3af" }}>
                      No business / fiscal profile yet. Customer must complete Business setup in the portal.
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "160px minmax(0, 1fr)",
                          rowGap: 6,
                          columnGap: 8,
                        }}
                      >
                        <div style={{ color: "#9ca3af" }}>Country</div>
                        <div>{fiscal.country ?? "—"}</div>
                        <div style={{ color: "#9ca3af" }}>Currency</div>
                        <div>{fiscal.currency}</div>
                        <div style={{ color: "#9ca3af" }}>Fiscal provider</div>
                        <div>
                          {formatProviderLabel(
                            fiscal.provider,
                            fiscal.providerLabel,
                            fiscal.fiscalConfigurationLabel,
                          )}
                        </div>
                        <div style={{ color: "#9ca3af" }}>Provider type</div>
                        <div>{providerTypeLabel(fiscal.providerType)}</div>
                        <div style={{ color: "#9ca3af" }}>Fiscal status</div>
                        <div>
                          <FiscalStatusPill
                            fiscal={fiscalForPill(fiscal, customerId, customer)}
                          />
                        </div>
                        <div style={{ color: "#9ca3af" }}>Receipt mode</div>
                        <div>{formatReceiptMode(fiscal.receiptMode)}</div>
                        <div style={{ color: "#9ca3af" }}>Supported exports</div>
                        <div>
                          {fiscal.supportedExports.length
                            ? fiscal.supportedExports.join(", ")
                            : "—"}
                        </div>
                        <div style={{ color: "#9ca3af" }}>POS download allowed</div>
                        <div>{fiscal.posDownloadAllowed ? "Yes" : "No"}</div>
                        <div style={{ color: "#9ca3af" }}>Last sync</div>
                        <div>{formatFiscalDate(fiscal.lastSyncAt)}</div>
                        {fiscal.fiscalNotice ? (
                          <>
                            <div style={{ color: "#9ca3af" }}>Notice</div>
                            <div style={{ color: "#cbd5e1" }}>{fiscal.fiscalNotice}</div>
                          </>
                        ) : null}
                      </div>
                      <div
                        style={{
                          marginTop: 14,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <Button
                          variant="secondary"
                          disabled
                          title={FISCAL_ACTION_TOOLTIP}
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                        >
                          Start setup
                        </Button>
                        <Button
                          variant="secondary"
                          disabled
                          title={FISCAL_ACTION_TOOLTIP}
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                        >
                          Mark active
                        </Button>
                        <Button
                          variant="secondary"
                          disabled
                          title={FISCAL_ACTION_TOOLTIP}
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                        >
                          Mark pending
                        </Button>
                        <Button
                          variant="secondary"
                          disabled
                          title={FISCAL_ACTION_TOOLTIP}
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                        >
                          View logs
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>

            {/* Legacy POS push archive (customers.profile) */}
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
                <div style={{ gridColumn: "1 / span 2", marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    Legacy POS push (archive)
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    Historical data from device bind/verify — not the active business source. Use Business card above (Customer Portal / business_profiles).
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
                    <div style={{ color: "#9ca3af" }}>Account name</div>
                    <div>
                      {customer.profile?.accountName || customer.name || "—"}
                    </div>
                    <div style={{ color: "#9ca3af" }}>Company</div>
                    <div>{customer.profile?.legalName || "—"}</div>
                    <div style={{ color: "#9ca3af" }}>External ID</div>
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
                    Contact &amp; location
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "120px minmax(0, 1fr)",
                      rowGap: 4,
                      columnGap: 8,
                    }}
                  >
                    <div style={{ color: "#9ca3af" }}>Contact</div>
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
                    <div style={{ color: "#9ca3af" }}>Phone</div>
                    <div>{customer.profile?.contact?.phone || "—"}</div>
                    <div style={{ color: "#9ca3af" }}>Location</div>
                    <div>
                      {customer.profile?.address?.city || "—"},{" "}
                      {customer.profile?.address?.country || "—"}
                    </div>
                    <div style={{ color: "#9ca3af" }}>Language</div>
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
                      Internal notes (POS)
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
                    Last update from POS:{" "}
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
                No legacy POS push data on file. Business data comes from the Customer Portal.
              </div>
            )}
          </Card>
          </div>

          {/* Subscriptions-Table */}
          <div style={{ marginBottom: 24 }}>
            <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h2 className="admin-section-title">Billing · Subscriptions</h2>
            </div>

            <DataTable>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="ds-muted" style={{ textAlign: "center", padding: 16 }}>
                      No subscriptions for this customer.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id.slice(0, 8)}…</td>
                      <td>{s.plan}</td>
                      <td>
                        <SubscriptionStatusPill status={s.status} />
                      </td>
                      <td>{formatDate(s.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </DataTable>
            </Card>
          </div>

          {/* Licenses-Table */}
          <div style={{ marginBottom: 24 }}>
            <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h2 className="admin-section-title">License</h2>
            </div>

            <DataTable>
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Max Devices</th>
                  <th>Valid until</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {licenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="ds-muted" style={{ textAlign: "center", padding: 16 }}>
                      No licenses for this customer.
                    </td>
                  </tr>
                ) : (
                  licenses.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <Link to={`/licenses/${l.id}`} className="ds-link">
                          {l.key}
                        </Link>
                      </td>
                      <td>{l.plan}</td>
                      <td>
                        <LicenseStatusPill status={l.status} />
                      </td>
                      <td>{l.maxDevices ?? "—"}</td>
                      <td>{formatDate(l.validUntil)}</td>
                      <td>{formatDate(l.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </DataTable>
            </Card>
          </div>

          {/* Devices-Table */}
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h2 className="admin-section-title">Devices</h2>
            </div>

            <DataTable>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>License(s)</th>
                  <th>Last signal</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="ds-muted" style={{ textAlign: "center", padding: 16 }}>
                      No devices for this customer.
                    </td>
                  </tr>
                ) : (
                  devices.map((d) => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td>{d.type}</td>
                      <td>
                        <DeviceStatusPill status={d.status} />
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
                                    className="ds-link"
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
                      <td>
                        <Button
                          variant="danger"
                          disabled={deleteBusyId === d.deviceId}
                          onClick={() => void handleDeleteDevice(d)}
                        >
                          {deleteBusyId === d.deviceId
                            ? "Removing…"
                            : "Remove"}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </DataTable>
          </Card>
        </>
      )}
    </div>
  );
}
