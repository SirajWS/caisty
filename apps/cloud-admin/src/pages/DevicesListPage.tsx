// apps/cloud-admin/src/pages/DevicesListPage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../lib/api";
import { useTheme, themeColors } from "../theme/ThemeContext";

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
  return d.toLocaleString("de-DE");
}

const MAX_LICENSES_INLINE = 4;

export default function DevicesListPage() {
  const { theme } = useTheme();
  const colors = themeColors[theme];
  const [rows, setRows] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGet<DevicesResponse>("/devices");
        if (cancelled) return;
        setRows(res.items ?? []);
      } catch (err) {
        console.error("Error loading devices", err);
        if (!cancelled) {
          setError("Fehler beim Laden der Devices.");
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
  }, []);

  // etwas hübsch sortieren: zuerst Kunde, dann Name
  const sortedRows = [...rows].sort((a, b) => {
    const ca = (a.customerName ?? "").toLowerCase();
    const cb = (b.customerName ?? "").toLowerCase();
    if (ca !== cb) return ca.localeCompare(cb);
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
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
        Devices
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: colors.textSecondary,
          marginBottom: "24px",
        }}
      >
        Alle registrierten POS-Geräte – nach Hardware-ID (Fingerprint / Device-ID)
        gruppiert.
      </p>

      {error && (
        <div
          className="admin-error-banner"
          style={{
            backgroundColor: colors.errorBg,
            borderColor: `${colors.error}50`,
            color: colors.error,
          }}
        >
          {error}
        </div>
      )}

      <div
        className="admin-card"
        style={{
          backgroundColor: colors.bgSecondary,
          borderColor: colors.border,
          transition: "background-color 0.3s, border-color 0.3s",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: 24,
              fontSize: 13,
              color: colors.textSecondary,
            }}
          >
            Lädt Devices…
          </div>
        ) : sortedRows.length === 0 ? (
          <div
            style={{
              padding: 24,
              fontSize: 13,
              color: colors.textSecondary,
            }}
          >
            Keine Devices vorhanden.
          </div>
        ) : (
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
                  <th style={{ color: colors.textSecondary }}>Name</th>
                  <th style={{ color: colors.textSecondary }}>Fingerprint</th>
                  <th style={{ color: colors.textSecondary }}>Licenses</th>
                  <th style={{ color: colors.textSecondary }}>Kunde</th>
                  <th style={{ color: colors.textSecondary }}>Status</th>
                  <th style={{ color: colors.textSecondary }}>
                    Letzter Kontakt
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((d) => {
                  const lastContact = d.lastHeartbeatAt || d.lastSeenAt || null;
                  const licenses = d.licenses ?? [];

                  return (
                    <tr
                      key={d.id}
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
                        <div style={{ whiteSpace: "nowrap" }}>{d.name}</div>
                        <div
                          style={{
                            fontSize: 11,
                            color: colors.textTertiary,
                            marginTop: 2,
                            textTransform: "uppercase",
                          }}
                        >
                          {d.type}
                        </div>
                      </td>
                      <td
                        style={{
                          color: colors.textSecondary,
                          fontFamily: "monospace",
                          fontSize: 12,
                        }}
                      >
                        {d.fingerprint ?? d.id}
                      </td>
                      <td style={{ color: colors.text }}>
                        {licenses.length === 0 ? (
                          <span style={{ opacity: 0.6 }}>—</span>
                        ) : (
                          <>
                            {licenses
                              .slice(0, MAX_LICENSES_INLINE)
                              .map((lic) => (
                                <div
                                  key={lic.id}
                                  style={{
                                    fontFamily: "monospace",
                                    fontSize: 11,
                                    lineHeight: "1.25",
                                    color: colors.text,
                                  }}
                                >
                                  {lic.key}{" "}
                                  <span style={{ color: colors.textTertiary }}>
                                    ({lic.plan})
                                  </span>
                                </div>
                              ))}
                            {licenses.length > MAX_LICENSES_INLINE && (
                              <div
                                style={{
                                  fontFamily: "monospace",
                                  fontSize: 11,
                                  color: colors.textTertiary,
                                  marginTop: 4,
                                }}
                              >
                                + {licenses.length - MAX_LICENSES_INLINE}{" "}
                                weitere Lizenz(en)
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      <td style={{ color: colors.text }}>
                        <div style={{ whiteSpace: "nowrap" }}>
                          {d.customerId ? (
                            <Link
                              to={`/customers/${d.customerId}`}
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
                              {d.customerName ?? d.customerId}
                            </Link>
                          ) : (
                            <span style={{ opacity: 0.6 }}>—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${d.status}`}>
                          {d.status}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDateTime(lastContact)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
