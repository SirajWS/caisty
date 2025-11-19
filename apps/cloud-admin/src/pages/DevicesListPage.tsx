// apps/cloud-admin/src/pages/Devices/DevicesListPage.tsx
import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

type Device = {
  id: string;
  name: string;
  type: string;
  status: string;
  lastSeenAt: string | null;
  createdAt: string;
};

type DevicesResponse = {
  items: Device[];
  total: number;
  limit: number;
  offset: number;
};

export default function DevicesListPage() {
  const [data, setData] = useState<DevicesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGet<DevicesResponse>("/devices?limit=20&offset=0")
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(String(err));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        padding: "24px 32px",
        maxWidth: "100%",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 24, fontWeight: 600 }}>
        Devices
      </h1>

      {loading && <p style={{ color: "#9ca3af" }}>Lade Devices…</p>}
      {error && (
        <p
          style={{
            color: "#f97316",
            padding: 12,
            backgroundColor: "#1f2937",
            borderRadius: 8,
          }}
        >
          Fehler beim Laden der Devices: {error}
        </p>
      )}

      {data && data.items.length === 0 && !loading && !error && (
        <p style={{ color: "#9ca3af" }}>Keine Devices gefunden.</p>
      )}

      {data && data.items.length > 0 && (
        <div
          style={{
            overflowX: "auto",
            width: "100%",
            backgroundColor: "#0f172a",
            borderRadius: 8,
            border: "1px solid #1f2937",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "650px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#1e293b" }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Typ</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Letztes Signal</th>
                <th style={thStyle}>Erstellt am</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((d, index) => (
                <tr
                  key={d.id}
                  style={{
                    backgroundColor:
                      index % 2 === 0 ? "#0f172a" : "#1e293b",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#1f2937")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      index % 2 === 0 ? "#0f172a" : "#1e293b")
                  }
                >
                  <td style={tdStyle}>{d.name}</td>
                  <td style={tdStyle}>{d.type}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor:
                          d.status === "active" ? "#065f46" : "#7f1d1d",
                        color:
                          d.status === "active" ? "#6ee7b7" : "#fca5a5",
                      }}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {d.lastSeenAt
                      ? new Date(d.lastSeenAt).toLocaleString("de-DE")
                      : "noch nie"}
                  </td>
                  <td style={tdStyle}>
                    {new Date(d.createdAt).toLocaleString("de-DE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #334155",
  padding: "12px 16px",
  fontWeight: 600,
  fontSize: 14,
  color: "#e5e7eb",
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #1e293b",
  padding: "12px 16px",
  fontSize: 14,
  color: "#d1d5db",
};
